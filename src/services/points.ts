import { Types } from "mongoose";
import { pointsRules } from "@config/points";
import { connectDb } from "@/lib/db";
import { AppError, isDuplicateKeyError } from "@/lib/errors";
import { Booking } from "@/models/Booking";
import { Clinic } from "@/models/Clinic";
import { User } from "@/models/User";
import { PointsEntry } from "@/models/Ledger";
import { logActivity } from "./activity";
import { zonedDateKey, zonedToUtc } from "./schedule";

function monthStartUtc(now: Date): Date {
  return zonedToUtc(`${zonedDateKey(now).slice(0, 7)}-01`, "00:00");
}

export type EarnResult = { awarded: true; points: number } | { awarded: false; reason: "monthly_cap" | "pair_cooldown" | "duplicate" | "not_completed" };

/**
 * Awards points for one completed booking if the caps allow it:
 * at most N earning visits per patient per calendar month (Pakistan time),
 * and at most one earning per patient and clinic pair within the cooldown window.
 */
export async function awardForCompletedBooking(bookingId: Types.ObjectId | string, now = new Date()): Promise<EarnResult> {
  await connectDb();
  const booking = await Booking.findById(bookingId).lean();
  if (!booking || booking.status !== "completed") return { awarded: false, reason: "not_completed" };

  const monthly = await PointsEntry.countDocuments({
    userId: booking.patientId,
    reason: "visit_completed",
    createdAt: { $gte: monthStartUtc(now) },
  });
  if (monthly >= pointsRules.maxEarningVisitsPerMonth) return { awarded: false, reason: "monthly_cap" };

  const recentPair = await PointsEntry.exists({
    userId: booking.patientId,
    clinicId: booking.clinicId,
    reason: "visit_completed",
    createdAt: { $gte: new Date(now.getTime() - pointsRules.samePairCooldownDays * 86400_000) },
  });
  if (recentPair) return { awarded: false, reason: "pair_cooldown" };

  try {
    await PointsEntry.create({
      userId: booking.patientId,
      delta: pointsRules.perCompletedVisit,
      reason: "visit_completed",
      bookingId: booking._id,
      clinicId: booking.clinicId,
      createdAt: now,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) return { awarded: false, reason: "duplicate" };
    throw err;
  }
  return { awarded: true, points: pointsRules.perCompletedVisit };
}

export async function pointsBalance(userId: Types.ObjectId | string): Promise<number> {
  await connectDb();
  const [row] = await PointsEntry.aggregate<{ total: number }>([
    { $match: { userId: new Types.ObjectId(String(userId)) } },
    { $group: { _id: null, total: { $sum: "$delta" } } },
  ]);
  return row?.total ?? 0;
}

export async function pointsHistory(userId: string, limit = 100) {
  await connectDb();
  return PointsEntry.find({ userId }).sort({ createdAt: -1 }).limit(limit).populate("clinicId", "name").lean();
}

/** Revocation never edits history: it appends a negative entry. The balance cannot go below zero. */
export async function revokePoints(actorId: string, userId: string, amount: number, note: string, bookingId?: string) {
  if (!Number.isInteger(amount) || amount <= 0) throw new AppError("validation");
  const balance = await pointsBalance(userId);
  const delta = -Math.min(amount, balance);
  if (delta === 0) throw new AppError("invalid_state");
  await PointsEntry.create({
    userId,
    delta,
    reason: "admin_revoke",
    note,
    bookingId: bookingId ? new Types.ObjectId(bookingId) : undefined,
    createdBy: actorId,
  });
  await logActivity(actorId, "points.revoke", "user", userId, { delta, note });
}

/** Patients with many completed bookings at the same clinic in the last 30 days. */
export async function suspiciousPatterns(now = new Date()) {
  await connectDb();
  const rows = await Booking.aggregate<{ _id: { patientId: Types.ObjectId; clinicId: Types.ObjectId }; count: number }>([
    { $match: { status: "completed", completedAt: { $gte: new Date(now.getTime() - 30 * 86400_000) } } },
    { $group: { _id: { patientId: "$patientId", clinicId: "$clinicId" }, count: { $sum: 1 } } },
    { $match: { count: { $gte: pointsRules.suspiciousSameClinicCompletions } } },
    { $sort: { count: -1 } },
    { $limit: 50 },
  ]);
  const [users, clinics] = await Promise.all([
    User.find({ _id: { $in: rows.map((r) => r._id.patientId) } }, { email: 1 }).lean(),
    Clinic.find({ _id: { $in: rows.map((r) => r._id.clinicId) } }, { name: 1 }).lean(),
  ]);
  const email = new Map(users.map((u) => [String(u._id), u.email]));
  const clinicName = new Map(clinics.map((c) => [String(c._id), c.name.en]));
  return rows.map((r) => ({
    key: `${r._id.patientId}-${r._id.clinicId}`,
    email: email.get(String(r._id.patientId)) ?? "",
    clinic: clinicName.get(String(r._id.clinicId)) ?? "",
    count: r.count,
  }));
}
