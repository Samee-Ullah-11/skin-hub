import { createHash, randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { AuthToken, type AuthTokenType } from "@/models/AuthToken";

export const TOKEN_TTL_HOURS: Record<AuthTokenType, number> = {
  verify_email: 24,
  reset_password: 1,
};

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Creates a single-use token, invalidating earlier unused tokens of the same type. Returns the raw value for the link. */
export async function issueToken(userId: Types.ObjectId | string, type: AuthTokenType, now = new Date()): Promise<string> {
  await connectDb();
  const raw = randomBytes(32).toString("base64url");
  await AuthToken.updateMany({ userId, type, usedAt: null }, { $set: { usedAt: now } });
  await AuthToken.create({
    userId,
    type,
    tokenHash: hashToken(raw),
    expiresAt: new Date(now.getTime() + TOKEN_TTL_HOURS[type] * 3600 * 1000),
  });
  return raw;
}

/** Marks the token used and returns its user ID. Expired, reused, and unknown tokens all fail the same way. */
export async function consumeToken(raw: string, type: AuthTokenType, now = new Date()): Promise<Types.ObjectId> {
  await connectDb();
  if (!raw || raw.length > 200) throw new AppError("invalid_state");
  const doc = await AuthToken.findOneAndUpdate(
    { tokenHash: hashToken(raw), type, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { returnDocument: "after" },
  ).lean();
  if (!doc) throw new AppError("invalid_state");
  return doc.userId;
}
