import "server-only";
import type { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { ActivityLog } from "@/models/Platform";

export async function logActivity(
  actorId: string,
  action: string,
  targetType: string,
  targetId?: Types.ObjectId | string,
  meta: Record<string, unknown> = {},
) {
  await connectDb();
  await ActivityLog.create({ actorId, action, targetType, targetId, meta });
}

export async function listActivity(page = 1, perPage = 50) {
  await connectDb();
  const [items, total] = await Promise.all([
    ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("actorId", "name email")
      .lean(),
    ActivityLog.countDocuments(),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / perPage)) };
}
