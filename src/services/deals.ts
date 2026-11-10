import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Treatment } from "@/models/Catalog";
import { Clinic } from "@/models/Clinic";
import { Deal } from "@/models/Deal";
import { Area, City } from "@/models/Location";
import { requireOwnClinic } from "./clinics";

export const DEAL_RULES = { minPercent: 5, maxPercent: 80, maxDays: 90, maxActivePerClinic: 10 } as const;

function runningFilter(now: Date) {
  return { startsAt: { $lte: now }, endsAt: { $gt: now }, endedAt: null };
}

function priced(base: number | undefined, percentOff: number) {
  if (typeof base !== "number") return { basePrice: null, dealPrice: null };
  return { basePrice: base, dealPrice: Math.round((base * (100 - percentOff)) / 100 / 50) * 50 };
}

/** Running deals at approved clinics, biggest discount first, with everything a deal card needs. */
export async function listActiveDeals(opts: { treatmentSlug?: string; limit?: number } = {}, now = new Date()) {
  await connectDb();
  const filter: Record<string, unknown> = runningFilter(now);
  if (opts.treatmentSlug) {
    const tr = await Treatment.findOne({ slug: opts.treatmentSlug }, { _id: 1 }).lean();
    if (!tr) return [];
    filter.treatmentId = tr._id;
  }
  const deals = await Deal.find(filter).sort({ percentOff: -1, endsAt: 1 }).limit(opts.limit ?? 60).lean();
  if (!deals.length) return [];
  const clinics = await Clinic.find({ _id: { $in: deals.map((d) => d.clinicId) }, status: "approved", deletedAt: null }).lean();
  const byClinic = new Map(clinics.map((c) => [String(c._id), c]));
  const [treatments, areas, cities] = await Promise.all([
    Treatment.find({ _id: { $in: deals.map((d) => d.treatmentId) } }, { name: 1, slug: 1 }).lean(),
    Area.find({ _id: { $in: clinics.map((c) => c.areaId).filter((x): x is Types.ObjectId => Boolean(x)) } }, { name: 1 }).lean(),
    City.find({ _id: { $in: clinics.map((c) => c.cityId).filter((x): x is Types.ObjectId => Boolean(x)) } }, { name: 1 }).lean(),
  ]);
  const tr = new Map(treatments.map((t) => [String(t._id), t]));
  const area = new Map(areas.map((a) => [String(a._id), a.name]));
  const city = new Map(cities.map((c) => [String(c._id), c.name]));

  return deals.flatMap((d) => {
    const clinic = byClinic.get(String(d.clinicId));
    const treatment = tr.get(String(d.treatmentId));
    // Hide deals whose clinic is not public or no longer lists the treatment.
    const listed = clinic?.treatments.find((x) => String(x.treatmentId) === String(d.treatmentId));
    if (!clinic || !treatment || !listed) return [];
    return [
      {
        id: String(d._id),
        percentOff: d.percentOff,
        note: d.note,
        endsAt: d.endsAt,
        isSample: Boolean(d.isSample || clinic.isSample),
        clinic,
        treatment,
        area: clinic.areaId ? area.get(String(clinic.areaId)) : undefined,
        city: clinic.cityId ? city.get(String(clinic.cityId)) : undefined,
        ...priced(listed.fromPricePkr, d.percentOff),
      },
    ];
  });
}

/** Percent off per treatment for one clinic's running deals (for its public page). */
export async function clinicDealMap(clinicId: Types.ObjectId | string, now = new Date()) {
  await connectDb();
  const deals = await Deal.find({ clinicId, ...runningFilter(now) }, { treatmentId: 1, percentOff: 1, endsAt: 1 }).lean();
  const out = new Map<string, { percentOff: number; endsAt: Date }>();
  for (const d of deals) {
    const key = String(d.treatmentId);
    const prev = out.get(key);
    if (!prev || d.percentOff > prev.percentOff) out.set(key, { percentOff: d.percentOff, endsAt: d.endsAt });
  }
  return out;
}

export async function listOwnDeals(ownerId: string) {
  const clinic = await requireOwnClinic(ownerId);
  await connectDb();
  return Deal.find({ clinicId: clinic._id }).sort({ endedAt: 1, endsAt: -1 }).limit(50).lean();
}

export interface DealInput {
  treatmentId: string;
  percentOff: number;
  startsAt: Date;
  endsAt: Date;
  note: string;
}

export async function createOwnDeal(ownerId: string, input: DealInput, now = new Date()) {
  const clinic = await requireOwnClinic(ownerId);
  if (clinic.status === "blocked") throw new AppError("invalid_state");
  if (!clinic.treatments.some((t) => String(t.treatmentId) === input.treatmentId)) {
    throw new AppError("validation", "treatment_not_listed", { treatmentId: "required" });
  }
  if (input.percentOff < DEAL_RULES.minPercent || input.percentOff > DEAL_RULES.maxPercent) {
    throw new AppError("validation", "bad_percent", { percentOff: "outOfRange" });
  }
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (input.endsAt <= input.startsAt || input.endsAt <= now || input.startsAt < startOfToday) {
    throw new AppError("validation", "bad_dates", { endsAt: "outOfRange" });
  }
  if (input.endsAt.getTime() - input.startsAt.getTime() > DEAL_RULES.maxDays * 86400_000) {
    throw new AppError("validation", "too_long", { endsAt: "outOfRange" });
  }
  await connectDb();
  const running = await Deal.countDocuments({ clinicId: clinic._id, endsAt: { $gt: now }, endedAt: null });
  if (running >= DEAL_RULES.maxActivePerClinic) throw new AppError("conflict", "too_many_deals");
  return Deal.create({ clinicId: clinic._id, ...input });
}

export async function endOwnDeal(ownerId: string, dealId: string, now = new Date()) {
  const clinic = await requireOwnClinic(ownerId);
  await connectDb();
  const res = await Deal.updateOne({ _id: dealId, clinicId: clinic._id, endedAt: null }, { $set: { endedAt: now } });
  if (!res.matchedCount) throw new AppError("not_found");
}
