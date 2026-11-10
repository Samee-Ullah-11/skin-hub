import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Clinic } from "@/models/Clinic";
import { LocationRequest } from "@/models/Location";
import { Statement } from "@/models/Ledger";
import { EmailLog } from "@/models/Notification";
import { ContactMessage, Waitlist } from "@/models/Platform";
import { User, type Role } from "@/models/User";
import { logActivity } from "./activity";

export async function adminOverview() {
  await connectDb();
  const weekAgo = new Date(Date.now() - 7 * 86400_000);
  const [pending, approved, patients, failedEmails, locationRequests, unpaid] = await Promise.all([
    Clinic.countDocuments({ status: "pending", deletedAt: null }),
    Clinic.countDocuments({ status: "approved", deletedAt: null }),
    User.countDocuments({ role: "patient", deletedAt: null }),
    EmailLog.countDocuments({ status: "failed", createdAt: { $gte: weekAgo } }),
    LocationRequest.countDocuments({ status: "pending" }),
    Statement.countDocuments({ status: "unpaid" }),
  ]);
  return { pending, approved, patients, failedEmails, locationRequests, unpaid };
}

export async function listUsers(filter: { role?: Role; q?: string } = {}) {
  await connectDb();
  const query: Record<string, unknown> = { deletedAt: null };
  if (filter.role) query.role = filter.role;
  if (filter.q) {
    const rx = { $regex: filter.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    query.$or = [{ email: rx }, { name: rx }];
  }
  return User.find(query).sort({ createdAt: -1 }).limit(200).lean();
}

export async function findUserByEmail(email: string) {
  await connectDb();
  return User.findOne({ email: email.toLowerCase() }).lean();
}

export async function setUserDisabled(actorId: string, userId: string, disabled: boolean) {
  if (actorId === userId) throw new AppError("forbidden");
  await connectDb();
  const res = await User.updateOne(
    { _id: userId, role: { $ne: "admin" } },
    disabled ? { $set: { disabledAt: new Date() }, $inc: { tokenVersion: 1 } } : { $unset: { disabledAt: 1 } },
  );
  if (!res.matchedCount) throw new AppError("not_found");
  await logActivity(actorId, disabled ? "user.disable" : "user.enable", "user", userId);
}

export async function revokeUserSessions(actorId: string, userId: string) {
  await connectDb();
  const res = await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
  if (!res.matchedCount) throw new AppError("not_found");
  await logActivity(actorId, "user.revoke_sessions", "user", userId);
}

export async function failedEmails() {
  await connectDb();
  return EmailLog.find({ status: "failed" }).sort({ createdAt: -1 }).limit(200).lean();
}

export async function listWaitlist() {
  await connectDb();
  return Waitlist.find().sort({ createdAt: -1 }).limit(500).populate("cityId", "name slug").lean();
}

export async function listContactMessages() {
  await connectDb();
  return ContactMessage.find().sort({ createdAt: -1 }).limit(200).lean();
}

export async function markMessageHandled(actorId: string, id: string) {
  await connectDb();
  await ContactMessage.updateOne({ _id: id }, { $set: { handledAt: new Date() } });
  await logActivity(actorId, "contact.handled", "contact_message", id);
}
