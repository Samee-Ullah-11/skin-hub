import { connectDb } from "@/lib/db";
import { Settings, type SettingsDoc } from "@/models/Platform";
import { logActivity } from "./activity";

export async function getSettings(): Promise<SettingsDoc> {
  await connectDb();
  const doc = await Settings.findOneAndUpdate(
    { key: "platform" },
    { $setOnInsert: { key: "platform" } },
    { upsert: true, returnDocument: "after" },
  ).lean();
  return doc!;
}

export type SettingsInput = Pick<
  SettingsDoc,
  "commissionMode" | "commissionRate" | "pendingExpiryHours" | "bookingWindowDays" | "rejectedDocsRetentionDays" | "requiredDocTypes"
>;

export async function updateSettings(actorId: string, input: SettingsInput) {
  await connectDb();
  await Settings.updateOne({ key: "platform" }, { $set: input }, { upsert: true });
  await logActivity(actorId, "settings.update", "settings", undefined, { ...input });
}
