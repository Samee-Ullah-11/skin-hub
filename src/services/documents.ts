import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { deleteAsset, privateDocumentUrl, verifyUpload, type UploadKind } from "@/lib/cloudinary";
import { Clinic } from "@/models/Clinic";
import { ClinicDocument } from "@/models/ClinicDocument";
import { logActivity } from "./activity";
import { requireOwnClinic } from "./clinics";
import { setOwnDoctorPhoto } from "./doctors";
import { getSettings } from "./settings";

const MAX_PHOTOS = 8;

export async function confirmUpload(
  owner: { id: string },
  input: { kind: UploadKind; publicId: string; docType?: string; doctorId?: string; originalName?: string; alt?: string },
) {
  const clinic = await requireOwnClinic(owner.id);
  if (clinic.status === "blocked") throw new AppError("invalid_state");
  const clinicId = String(clinic._id);

  if (input.kind === "document") {
    const settings = await getSettings();
    if (!input.docType || !settings.requiredDocTypes.some((d) => d.key === input.docType)) {
      throw new AppError("validation", "doc_type");
    }
  }
  if (input.kind === "photo" && clinic.photos.length >= MAX_PHOTOS) throw new AppError("invalid_state", "too_many_photos");

  const asset = await verifyUpload(clinicId, input.kind, input.publicId);

  if (input.kind === "document") {
    await ClinicDocument.create({
      clinicId: clinic._id,
      docType: input.docType,
      publicId: asset.publicId,
      resourceType: "image",
      format: asset.format,
      bytes: asset.bytes,
      originalName: (input.originalName ?? "").slice(0, 200),
      uploadedBy: owner.id,
    });
  } else if (input.kind === "photo") {
    await Clinic.updateOne(
      { _id: clinic._id },
      { $push: { photos: { publicId: asset.publicId, width: asset.width, height: asset.height, alt: (input.alt ?? "").slice(0, 160) } } },
    );
  } else {
    if (!input.doctorId) throw new AppError("validation");
    await setOwnDoctorPhoto(owner.id, input.doctorId, { publicId: asset.publicId, width: asset.width, height: asset.height });
  }
}

export async function listOwnDocuments(ownerId: string) {
  const clinic = await requireOwnClinic(ownerId);
  return ClinicDocument.find({ clinicId: clinic._id, deletedAt: null }, { publicId: 0 }).sort({ createdAt: -1 }).lean();
}

export async function removeOwnDocument(ownerId: string, documentId: string) {
  const clinic = await requireOwnClinic(ownerId);
  if (clinic.status === "pending") throw new AppError("invalid_state");
  const doc = await ClinicDocument.findOneAndUpdate(
    { _id: documentId, clinicId: clinic._id, deletedAt: null, reviewStatus: { $ne: "accepted" } },
    { $set: { deletedAt: new Date() } },
  ).lean();
  if (!doc) throw new AppError("not_found");
  await deleteAsset(doc.publicId, "document").catch((err) => logger.warn("document asset delete failed", { error: err }));
}

export async function removeOwnPhoto(ownerId: string, publicId: string) {
  const clinic = await requireOwnClinic(ownerId);
  if (!clinic.photos.some((p) => p.publicId === publicId)) throw new AppError("not_found");
  await Clinic.updateOne({ _id: clinic._id }, { $pull: { photos: { publicId } } });
  await deleteAsset(publicId, "photo").catch((err) => logger.warn("photo asset delete failed", { error: err }));
}

/** Admin only: a short-lived link to a private document. Nothing about the document is logged. */
export async function adminDocumentUrl(actorId: string, documentId: string): Promise<string> {
  await connectDb();
  if (!Types.ObjectId.isValid(documentId)) throw new AppError("not_found");
  const doc = await ClinicDocument.findOne({ _id: documentId, deletedAt: null }).lean();
  if (!doc) throw new AppError("not_found");
  await logActivity(actorId, "document.view", "clinic", doc.clinicId, { documentId });
  return privateDocumentUrl(doc.publicId, doc.format);
}

export async function reviewDocument(actorId: string, documentId: string, accept: boolean, note?: string) {
  await connectDb();
  const res = await ClinicDocument.updateOne(
    { _id: documentId, deletedAt: null },
    { $set: { reviewStatus: accept ? "accepted" : "rejected", reviewNote: note, reviewedBy: actorId, reviewedAt: new Date() } },
  );
  if (!res.matchedCount) throw new AppError("not_found");
  await logActivity(actorId, accept ? "document.accept" : "document.reject", "document", documentId, { note });
}

/** Called by the daily cron: removes documents of rejected clinics after the retention period. */
export async function purgeExpiredDocuments(now = new Date()): Promise<number> {
  await connectDb();
  const due = await ClinicDocument.find({ purgeAfter: { $lte: now }, deletedAt: null }).limit(200).lean();
  let purged = 0;
  for (const doc of due) {
    const clinic = await Clinic.findById(doc.clinicId, { status: 1 }).lean();
    if (clinic && clinic.status !== "rejected") {
      await ClinicDocument.updateOne({ _id: doc._id }, { $unset: { purgeAfter: 1 } });
      continue;
    }
    await deleteAsset(doc.publicId, "document").catch((err) => logger.warn("purge delete failed", { error: err }));
    await ClinicDocument.updateOne({ _id: doc._id }, { $set: { deletedAt: now } });
    purged++;
  }
  return purged;
}
