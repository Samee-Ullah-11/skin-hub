import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Doctor, type WeeklyDay } from "@/models/Doctor";
import type { Localized } from "@/models/shared";
import { requireOwnClinic } from "./clinics";

export interface DoctorInput {
  name: Localized;
  gender?: "female" | "male";
  specialty: Localized;
  qualifications: string;
  bio: Localized;
  slotMinutes: number;
  weekly: WeeklyDay[];
  blockedDates: string[];
  active: boolean;
}

export async function listOwnDoctors(ownerId: string) {
  const clinic = await requireOwnClinic(ownerId);
  return Doctor.find({ clinicId: clinic._id }).sort({ sortOrder: 1, createdAt: 1 }).lean();
}

/** Loads a doctor only if it belongs to the caller's own clinic; any other ID is treated as not found. */
export async function getOwnDoctor(ownerId: string, doctorId: string) {
  const clinic = await requireOwnClinic(ownerId);
  const doctor = await Doctor.findOne({ _id: doctorId, clinicId: clinic._id }).lean();
  if (!doctor) throw new AppError("not_found");
  return doctor;
}

export async function createOwnDoctor(ownerId: string, input: DoctorInput) {
  const clinic = await requireOwnClinic(ownerId);
  const count = await Doctor.countDocuments({ clinicId: clinic._id });
  const doc = await Doctor.create({ ...input, clinicId: clinic._id, sortOrder: count + 1 });
  return doc.toObject();
}

export async function updateOwnDoctor(ownerId: string, doctorId: string, input: DoctorInput) {
  const clinic = await requireOwnClinic(ownerId);
  const res = await Doctor.updateOne({ _id: doctorId, clinicId: clinic._id }, { $set: input });
  if (!res.matchedCount) throw new AppError("not_found");
}

export async function setOwnDoctorPhoto(ownerId: string, doctorId: string, photo: { publicId: string; width: number; height: number }) {
  const clinic = await requireOwnClinic(ownerId);
  const res = await Doctor.updateOne({ _id: doctorId, clinicId: clinic._id }, { $set: { photo } });
  if (!res.matchedCount) throw new AppError("not_found");
}

export async function getPublicDoctor(doctorId: string) {
  await connectDb();
  return Doctor.findOne({ _id: doctorId, active: true }).lean();
}
