import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import { Area, City } from "@/models/Location";
import { Category, Treatment } from "@/models/Catalog";
import { Clinic, type ClinicDoc, type ClinicStatus, type CommissionMode } from "@/models/Clinic";
import { ClinicDocument } from "@/models/ClinicDocument";
import { Doctor, type DoctorDoc } from "@/models/Doctor";
import { User } from "@/models/User";
import type { Localized } from "@/models/shared";
import { logActivity } from "./activity";
import { notify } from "./notifications";
import { getSettings } from "./settings";
import { isOpenAt } from "./schedule";

export function isFeatured(c: Pick<ClinicDoc, "featuredFrom" | "featuredUntil">, now = new Date()): boolean {
  return Boolean(c.featuredFrom && c.featuredUntil && c.featuredFrom <= now && c.featuredUntil >= now);
}

async function uniqueSlug(base: string, excludeId?: Types.ObjectId): Promise<string> {
  const root = slugify(base) || "clinic";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await Clinic.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return candidate;
  }
  return `${root}-${new Types.ObjectId().toString().slice(-6)}`;
}

/** Every owner action resolves the clinic from the session user, never from an ID sent by the client. */
export async function getOwnClinic(ownerId: string) {
  await connectDb();
  return Clinic.findOne({ ownerId, deletedAt: null }).lean();
}

export async function requireOwnClinic(ownerId: string) {
  const clinic = await getOwnClinic(ownerId);
  if (!clinic) throw new AppError("not_found");
  return clinic;
}

export async function ensureOwnClinic(ownerId: string, ownerName: string) {
  await connectDb();
  const existing = await Clinic.findOne({ ownerId, deletedAt: null }).lean();
  if (existing) return existing;
  const created = await Clinic.create({
    ownerId,
    name: { en: ownerName, ur: "" },
    slug: await uniqueSlug(`clinic-${new Types.ObjectId().toString().slice(-6)}`),
    status: "draft",
  });
  return created.toObject();
}

/** Draft clinic created together with a clinic owner's account at registration. */
export async function createDraftClinic(ownerId: string, input: { name: string; cityId: string; provinceId: string }) {
  await connectDb();
  const existing = await Clinic.findOne({ ownerId, deletedAt: null }).lean();
  if (existing) return existing;
  const created = await Clinic.create({
    ownerId,
    name: { en: input.name, ur: "" },
    cityId: input.cityId,
    provinceId: input.provinceId,
    slug: await uniqueSlug(input.name),
    status: "draft",
  });
  return created.toObject();
}

export interface ClinicProfileInput {
  name: Localized;
  categoryId: string;
  provinceId: string;
  cityId: string;
  areaId: string;
  address: Localized;
  lat?: number;
  lng?: number;
  phone: string;
  whatsapp: string;
  description: Localized;
  treatments: { treatmentId: string; fromPricePkr?: number }[];
}

export async function updateOwnProfile(ownerId: string, input: ClinicProfileInput) {
  await connectDb();
  const clinic = await Clinic.findOne({ ownerId, deletedAt: null });
  if (!clinic) throw new AppError("not_found");
  if (clinic.status === "blocked") throw new AppError("invalid_state");

  const [category, city, area] = await Promise.all([
    Category.findOne({ _id: input.categoryId, active: true }).lean(),
    City.findOne({ _id: input.cityId, provinceId: input.provinceId }).lean(),
    Area.findOne({ _id: input.areaId, cityId: input.cityId }).lean(),
  ]);
  if (!category) throw new AppError("validation", "category", { categoryId: "required" });
  if (!city) throw new AppError("validation", "city", { cityId: "required" });
  if (!area) throw new AppError("validation", "area", { areaId: "required" });

  const treatmentIds = [...new Set(input.treatments.map((t) => t.treatmentId))];
  const validTreatments = await Treatment.find({ _id: { $in: treatmentIds }, categoryId: category._id, active: true }, { _id: 1 }).lean();
  const valid = new Set(validTreatments.map((t) => String(t._id)));

  const nameChanged = clinic.name.en !== input.name.en || clinic.slug.startsWith("clinic-");
  clinic.name = input.name;
  clinic.categoryId = category._id;
  clinic.provinceId = city.provinceId;
  clinic.cityId = city._id;
  clinic.areaId = area._id;
  clinic.address = input.address;
  clinic.phone = input.phone;
  clinic.whatsapp = input.whatsapp;
  clinic.description = input.description;
  clinic.treatments = input.treatments
    .filter((t) => valid.has(t.treatmentId))
    .map((t) => ({ treatmentId: new Types.ObjectId(t.treatmentId), fromPricePkr: t.fromPricePkr }));
  if (typeof input.lat === "number" && typeof input.lng === "number") {
    clinic.location = { type: "Point", coordinates: [input.lng, input.lat] };
  }
  if (nameChanged && clinic.status !== "approved") {
    clinic.slug = await uniqueSlug(`${input.name.en} ${city.slug}`, clinic._id);
  }
  await clinic.save();
  return clinic.toObject();
}

export interface Readiness {
  profile: boolean;
  location: boolean;
  treatments: boolean;
  doctors: boolean;
  documents: { key: string; label: Localized; done: boolean }[];
  ready: boolean;
}

export async function clinicReadiness(clinic: ClinicDoc): Promise<Readiness> {
  await connectDb();
  const settings = await getSettings();
  const [docs, doctorCount] = await Promise.all([
    ClinicDocument.find({ clinicId: clinic._id, deletedAt: null, reviewStatus: { $ne: "rejected" } }, { docType: 1 }).lean(),
    Doctor.countDocuments({ clinicId: clinic._id, active: true }),
  ]);
  const have = new Set(docs.map((d) => d.docType));
  const documents = settings.requiredDocTypes.map((d) => ({ key: d.key, label: d.label, done: have.has(d.key) }));
  const profile = Boolean(
    clinic.name?.en && clinic.categoryId && clinic.cityId && clinic.areaId && clinic.address?.en && clinic.phone && clinic.whatsapp && clinic.description?.en,
  );
  const location = Boolean(clinic.location?.coordinates?.length === 2);
  const treatments = clinic.treatments.length > 0;
  const doctors = doctorCount > 0;
  return {
    profile,
    location,
    treatments,
    doctors,
    documents,
    ready: profile && location && treatments && doctors && documents.every((d) => d.done),
  };
}

export async function submitOwnClinic(ownerId: string) {
  await connectDb();
  const clinic = await Clinic.findOne({ ownerId, deletedAt: null });
  if (!clinic) throw new AppError("not_found");
  if (clinic.status !== "draft" && clinic.status !== "rejected") throw new AppError("invalid_state");
  const readiness = await clinicReadiness(clinic.toObject());
  if (!readiness.ready) throw new AppError("validation", "incomplete");
  clinic.status = "pending";
  clinic.submittedAt = new Date();
  clinic.rejectionReason = undefined;
  await clinic.save();
}

// ---------- Admin ----------

export async function listClinicsForAdmin(filter: { status?: ClinicStatus; q?: string; includeDeleted?: boolean } = {}) {
  await connectDb();
  const query: Record<string, unknown> = {};
  if (!filter.includeDeleted) query.deletedAt = null;
  if (filter.status) query.status = filter.status;
  if (filter.q) query["name.en"] = { $regex: filter.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  return Clinic.find(query).sort({ submittedAt: 1, createdAt: -1 }).limit(300).populate("ownerId", "name email phone").lean();
}

export async function getClinicForAdmin(id: string) {
  await connectDb();
  const clinic = await Clinic.findById(id).populate("ownerId", "name email phone emailVerifiedAt").lean();
  if (!clinic) throw new AppError("not_found");
  const documents = await ClinicDocument.find({ clinicId: clinic._id, deletedAt: null }).sort({ createdAt: -1 }).lean();
  return { clinic, documents };
}

async function setStatus(
  actorId: string,
  clinicId: string,
  from: ClinicStatus[],
  to: ClinicStatus,
  extra: Partial<ClinicDoc>,
  action: string,
) {
  await connectDb();
  const clinic = await Clinic.findOneAndUpdate(
    { _id: clinicId, status: { $in: from }, deletedAt: null },
    { $set: { status: to, ...extra } },
    { returnDocument: "after" },
  ).lean();
  if (!clinic) throw new AppError("invalid_state");
  await logActivity(actorId, action, "clinic", clinic._id, { to, ...extra });
  return clinic;
}

export async function approveClinic(actorId: string, clinicId: string) {
  const clinic = await setStatus(actorId, clinicId, ["pending", "rejected"], "approved", { approvedAt: new Date(), rejectionReason: undefined }, "clinic.approve");
  await ClinicDocument.updateMany({ clinicId: clinic._id, reviewStatus: "submitted" }, { $set: { reviewStatus: "accepted", reviewedBy: actorId, reviewedAt: new Date() } });
  await notify({
    userId: clinic.ownerId,
    type: "clinic_approved",
    params: { clinic: clinic.name.en },
    link: "/dashboard",
    email: { template: "clinicApproved", ctaPath: "/dashboard" },
  });
}

export async function rejectClinic(actorId: string, clinicId: string, reason: string) {
  const settings = await getSettings();
  const clinic = await setStatus(actorId, clinicId, ["pending"], "rejected", { rejectionReason: reason, rejectedAt: new Date() }, "clinic.reject");
  const purgeAfter = new Date(Date.now() + settings.rejectedDocsRetentionDays * 86400_000);
  await ClinicDocument.updateMany({ clinicId: clinic._id, deletedAt: null }, { $set: { purgeAfter } });
  await notify({
    userId: clinic.ownerId,
    type: "clinic_rejected",
    params: { clinic: clinic.name.en, reason },
    link: "/dashboard",
    email: { template: "clinicRejected", ctaPath: "/dashboard" },
  });
}

export async function blockClinic(actorId: string, clinicId: string, reason: string) {
  const clinic = await setStatus(actorId, clinicId, ["approved", "pending", "draft", "rejected"], "blocked", { blockReason: reason }, "clinic.block");
  await notify({
    userId: clinic.ownerId,
    type: "clinic_blocked",
    params: { clinic: clinic.name.en, reason },
    link: "/dashboard",
    email: { template: "clinicBlocked" },
  });
}

export async function unblockClinic(actorId: string, clinicId: string) {
  await setStatus(actorId, clinicId, ["blocked"], "approved", { blockReason: undefined }, "clinic.unblock");
}

export async function softDeleteClinic(actorId: string, clinicId: string) {
  await connectDb();
  const res = await Clinic.updateOne({ _id: clinicId, deletedAt: null }, { $set: { deletedAt: new Date() } });
  if (!res.matchedCount) throw new AppError("not_found");
  await logActivity(actorId, "clinic.delete", "clinic", clinicId);
}

export async function setFeatured(actorId: string, clinicId: string, input: { from?: Date; until?: Date; note?: string }) {
  await connectDb();
  const update = input.from && input.until
    ? { $set: { featuredFrom: input.from, featuredUntil: input.until, featuredNote: input.note ?? "" } }
    : { $unset: { featuredFrom: 1, featuredUntil: 1, featuredNote: 1 } };
  const res = await Clinic.updateOne({ _id: clinicId, deletedAt: null }, update);
  if (!res.matchedCount) throw new AppError("not_found");
  await logActivity(actorId, input.from ? "clinic.feature" : "clinic.unfeature", "clinic", clinicId, input);
}

export async function setCommissionOverride(actorId: string, clinicId: string, override?: { mode: CommissionMode; rate: number }) {
  await connectDb();
  const update = override ? { $set: { commissionOverride: override } } : { $unset: { commissionOverride: 1 } };
  const res = await Clinic.updateOne({ _id: clinicId }, update);
  if (!res.matchedCount) throw new AppError("not_found");
  await logActivity(actorId, "clinic.commission_override", "clinic", clinicId, { override });
}

// ---------- Public ----------

const PUBLIC_FILTER = { status: "approved", deletedAt: null } as const;

export async function getPublicClinicBySlug(slug: string) {
  await connectDb();
  return Clinic.findOne({ slug: slug.toLowerCase(), ...PUBLIC_FILTER }).lean();
}

export async function getClinicDisplayData(clinic: ClinicDoc, opts: { activeDoctorsOnly?: boolean } = { activeDoctorsOnly: true }) {
  await connectDb();
  const [doctors, treatments, city, area, category] = await Promise.all([
    Doctor.find({ clinicId: clinic._id, ...(opts.activeDoctorsOnly ? { active: true } : {}) }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    Treatment.find({ _id: { $in: clinic.treatments.map((t) => t.treatmentId) } }).lean(),
    clinic.cityId ? City.findById(clinic.cityId).lean() : null,
    clinic.areaId ? Area.findById(clinic.areaId).lean() : null,
    clinic.categoryId ? Category.findById(clinic.categoryId).lean() : null,
  ]);
  return { doctors, treatments, city, area, category };
}

export interface SearchFilters {
  cityId: Types.ObjectId;
  areaId?: string;
  treatmentId?: string;
  gender?: "female" | "male";
  openNow?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  perPage?: number;
}

export async function searchClinics(f: SearchFilters, now = new Date()) {
  await connectDb();
  const query: Record<string, unknown> = { ...PUBLIC_FILTER, cityId: f.cityId };
  if (f.areaId) query.areaId = new Types.ObjectId(f.areaId);

  const priceCond: Record<string, number> = {};
  if (typeof f.minPrice === "number") priceCond.$gte = f.minPrice;
  if (typeof f.maxPrice === "number") priceCond.$lte = f.maxPrice;
  if (f.treatmentId || Object.keys(priceCond).length) {
    query.treatments = {
      $elemMatch: {
        ...(f.treatmentId ? { treatmentId: new Types.ObjectId(f.treatmentId) } : {}),
        ...(Object.keys(priceCond).length ? { fromPricePkr: priceCond } : {}),
      },
    };
  }

  const candidates = await Clinic.find(query).limit(500).lean();
  const ids = candidates.map((c) => c._id);
  const doctors = await Doctor.find({ clinicId: { $in: ids }, active: true }, { clinicId: 1, gender: 1, weekly: 1, blockedDates: 1 }).lean();
  const byClinic = new Map<string, Pick<DoctorDoc, "gender" | "weekly" | "blockedDates">[]>();
  for (const d of doctors) {
    const list = byClinic.get(String(d.clinicId)) ?? [];
    list.push(d);
    byClinic.set(String(d.clinicId), list);
  }

  const filtered = candidates.filter((c) => {
    const docs = byClinic.get(String(c._id)) ?? [];
    if (f.gender && !docs.some((d) => d.gender === f.gender)) return false;
    if (f.openNow && !docs.some((d) => isOpenAt(d, now))) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const fa = isFeatured(a, now) ? 1 : 0;
    const fb = isFeatured(b, now) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    return (b.approvedAt?.getTime() ?? 0) - (a.approvedAt?.getTime() ?? 0);
  });

  const perPage = f.perPage ?? 12;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const page = Math.min(Math.max(1, f.page ?? 1), pages);
  return { items: filtered.slice((page - 1) * perPage, page * perPage), total: filtered.length, page, pages };
}

export async function featuredClinics(limit = 6, now = new Date()) {
  await connectDb();
  const activeCities = await City.find({ active: true }, { _id: 1 }).lean();
  const all = await Clinic.find({ ...PUBLIC_FILTER, cityId: { $in: activeCities.map((c) => c._id) } })
    .sort({ approvedAt: -1 })
    .limit(60)
    .lean();
  return all.sort((a, b) => Number(isFeatured(b, now)) - Number(isFeatured(a, now))).slice(0, limit);
}

/** For each treatment: how many approved clinics offer it and the lowest starting price they list. */
export async function treatmentOffers() {
  await connectDb();
  const rows = await Clinic.aggregate<{ _id: Types.ObjectId; clinics: number; minPrice: number | null }>([
    { $match: { status: "approved", deletedAt: null } },
    { $unwind: "$treatments" },
    { $group: { _id: "$treatments.treatmentId", clinics: { $sum: 1 }, minPrice: { $min: "$treatments.fromPricePkr" } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), { clinics: r.clinics, minPrice: typeof r.minPrice === "number" ? r.minPrice : null }]));
}

export async function publicStats() {
  await connectDb();
  const [clinics, users] = await Promise.all([
    Clinic.countDocuments(PUBLIC_FILTER),
    User.countDocuments({ role: "patient", deletedAt: null }),
  ]);
  return { clinics, users };
}

export async function listPublicSlugs() {
  await connectDb();
  return Clinic.find(PUBLIC_FILTER, { slug: 1, updatedAt: 1 }).lean();
}
