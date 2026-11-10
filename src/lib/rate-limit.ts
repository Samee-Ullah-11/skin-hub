import { connectDb } from "@/lib/db";
import { AppError, isDuplicateKeyError } from "@/lib/errors";
import { RateLimit } from "@/models/RateLimit";

export interface Limit {
  name: string;
  max: number;
  windowSeconds: number;
}

export const LIMITS = {
  signup: { name: "signup", max: 5, windowSeconds: 3600 },
  login: { name: "login", max: 10, windowSeconds: 900 },
  loginIp: { name: "login-ip", max: 50, windowSeconds: 900 },
  resendVerification: { name: "resend", max: 3, windowSeconds: 3600 },
  forgotPassword: { name: "forgot", max: 3, windowSeconds: 3600 },
  resetPassword: { name: "reset", max: 10, windowSeconds: 3600 },
  booking: { name: "booking", max: 10, windowSeconds: 3600 },
  waitlist: { name: "waitlist", max: 5, windowSeconds: 3600 },
  contact: { name: "contact", max: 5, windowSeconds: 3600 },
  upload: { name: "upload", max: 60, windowSeconds: 3600 },
} satisfies Record<string, Limit>;

/** Fixed-window counter stored in MongoDB so it holds across serverless instances. Throws rate_limited when over. */
export async function hitLimit(limit: Limit, subject: string): Promise<void> {
  await connectDb();
  const now = Date.now();
  const windowMs = limit.windowSeconds * 1000;
  const bucket = Math.floor(now / windowMs);
  const key = `${limit.name}:${subject}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowMs);

  const bump = () =>
    RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after" },
    ).lean();

  let doc;
  try {
    doc = await bump();
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    doc = await bump();
  }
  if (doc && doc.count > limit.max) throw new AppError("rate_limited");
}
