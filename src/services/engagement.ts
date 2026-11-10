import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError, isDuplicateKeyError } from "@/lib/errors";
import { Clinic } from "@/models/Clinic";
import { ClinicLike, Testimonial } from "@/models/Engagement";
import type { Localized } from "@/models/shared";
import { logActivity } from "./activity";

/** Toggles a patient's like on an approved clinic and returns the new state and count. */
export async function toggleLike(userId: string, clinicId: string) {
  await connectDb();
  if (!Types.ObjectId.isValid(clinicId)) throw new AppError("not_found");
  const clinic = await Clinic.exists({ _id: clinicId, status: "approved", deletedAt: null });
  if (!clinic) throw new AppError("not_found");
  const removed = await ClinicLike.deleteOne({ userId, clinicId });
  let liked = false;
  if (!removed.deletedCount) {
    try {
      await ClinicLike.create({ userId, clinicId });
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }
    liked = true;
  }
  return { liked, count: await ClinicLike.countDocuments({ clinicId }) };
}

/** Like counts for the given clinics, and which of them the viewer has liked. */
export async function likeInfo(clinicIds: Types.ObjectId[], viewerId?: string) {
  await connectDb();
  const [counts, mine] = await Promise.all([
    ClinicLike.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { clinicId: { $in: clinicIds } } },
      { $group: { _id: "$clinicId", n: { $sum: 1 } } },
    ]),
    viewerId ? ClinicLike.find({ userId: viewerId, clinicId: { $in: clinicIds } }, { clinicId: 1 }).lean() : [],
  ]);
  const count = new Map(counts.map((c) => [String(c._id), c.n]));
  const liked = new Set(mine.map((m) => String(m.clinicId)));
  return { count, liked };
}

/** Approved clinics the patient has liked, newest like first. */
export async function listSavedClinics(userId: string) {
  await connectDb();
  const likes = await ClinicLike.find({ userId }).sort({ createdAt: -1 }).limit(60).lean();
  const ids = likes.map((l) => l.clinicId);
  const clinics = await Clinic.find({ _id: { $in: ids }, status: "approved", deletedAt: null }).lean();
  const byId = new Map(clinics.map((c) => [String(c._id), c]));
  return ids.map((id) => byId.get(String(id))).filter((c): c is NonNullable<typeof c> => Boolean(c));
}

/** Approved clinics from a list of IDs (a visitor's cookie likes), in the given order. */
export async function listClinicsByIds(ids: string[]) {
  const valid = ids.filter((id) => Types.ObjectId.isValid(id));
  if (!valid.length) return [];
  await connectDb();
  const clinics = await Clinic.find({ _id: { $in: valid }, status: "approved", deletedAt: null }).lean();
  const byId = new Map(clinics.map((c) => [String(c._id), c]));
  return valid.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
}

/** Moves a visitor's cookie likes into their patient account after they log in or sign up. */
export async function mergeGuestLikes(userId: string, clinicIds: string[]) {
  const valid = clinicIds.filter((id) => Types.ObjectId.isValid(id));
  if (!valid.length) return 0;
  await connectDb();
  const approved = await Clinic.find({ _id: { $in: valid }, status: "approved", deletedAt: null }, { _id: 1 }).lean();
  const ops = approved.map((c) => ({
    updateOne: { filter: { userId, clinicId: c._id }, update: { $setOnInsert: { userId, clinicId: c._id } }, upsert: true },
  }));
  if (ops.length) await ClinicLike.bulkWrite(ops, { ordered: false });
  return ops.length;
}

export async function listTestimonials(opts: { activeOnly?: boolean } = {}) {
  await connectDb();
  return Testimonial.find(opts.activeOnly ? { active: true } : {}).sort({ sortOrder: 1, createdAt: -1 }).limit(30).lean();
}

export async function saveTestimonial(actorId: string, input: { id?: string; name: string; quote: Localized; active: boolean }) {
  await connectDb();
  const data = { name: input.name, quote: input.quote, active: input.active };
  const doc = input.id
    ? await Testimonial.findByIdAndUpdate(input.id, data, { returnDocument: "after" })
    : await Testimonial.create(data);
  if (!doc) throw new AppError("not_found");
  await logActivity(actorId, input.id ? "testimonial.update" : "testimonial.create", "testimonial", doc._id);
}

export async function deleteTestimonial(actorId: string, id: string) {
  await connectDb();
  await Testimonial.deleteOne({ _id: id });
  await logActivity(actorId, "testimonial.delete", "testimonial", id);
}
