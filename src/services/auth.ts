import "server-only";
import { emails } from "@/i18n/dict/emails";
import { localePath, type Lang } from "@/i18n/config";
import { hashPassword, verifyPassword, burnPasswordCheck } from "@/lib/auth/password";
import { consumeToken, issueToken } from "@/lib/auth/tokens";
import { connectDb } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError, isDuplicateKeyError } from "@/lib/errors";
import { hitLimit, LIMITS } from "@/lib/rate-limit";
import { City } from "@/models/Location";
import { User, type UserDoc } from "@/models/User";
import { createDraftClinic } from "./clinics";
import { sendEmail } from "./email";

function link(lang: Lang, path: string): string {
  return `${env().APP_URL}${localePath(lang, path)}`;
}

async function sendVerification(user: Pick<UserDoc, "_id" | "email" | "name">, lang: Lang) {
  const token = await issueToken(user._id, "verify_email");
  await sendEmail({
    to: user.email,
    lang,
    template: "verifyEmail",
    name: user.name,
    cta: { url: link(lang, `/verify-email?token=${token}`), label: emails[lang].verifyEmail_cta },
  });
}

export async function signup(
  input: { name: string; email: string; phone: string; password: string; role: "patient" | "clinic_owner" },
  ctx: { ip: string; lang: Lang },
) {
  await hitLimit(LIMITS.signup, ctx.ip);
  await connectDb();
  let user;
  try {
    user = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      locale: ctx.lang,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new AppError("conflict", "email_taken", { email: "emailTaken" });
    throw err;
  }
  await sendVerification(user, ctx.lang);
  return user;
}

/** Clinic registration: validates the city, creates the owner account, then a draft clinic. */
export async function signupClinic(
  input: { clinicName: string; cityId: string; name: string; email: string; phone: string; password: string },
  ctx: { ip: string; lang: Lang },
) {
  await connectDb();
  const city = await City.findOne({ _id: input.cityId, active: true }).lean();
  if (!city) throw new AppError("validation", "bad_city", { cityId: "required" });
  const user = await signup({ ...input, role: "clinic_owner" }, ctx);
  await createDraftClinic(String(user._id), { name: input.clinicName, cityId: String(city._id), provinceId: String(city.provinceId) });
  return user;
}

export async function login(input: { email: string; password: string }, ctx: { ip: string }) {
  await hitLimit(LIMITS.loginIp, ctx.ip);
  await hitLimit(LIMITS.login, `${ctx.ip}:${input.email}`);
  await connectDb();
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user) {
    await burnPasswordCheck(input.password);
    throw new AppError("bad_credentials");
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok || user.deletedAt || user.disabledAt) throw new AppError("bad_credentials");
  return user;
}

export async function verifyEmail(token: string) {
  const userId = await consumeToken(token, "verify_email");
  await connectDb();
  await User.updateOne({ _id: userId, emailVerifiedAt: null }, { $set: { emailVerifiedAt: new Date() } });
  return userId;
}

export async function resendVerification(userId: string, lang: Lang) {
  await hitLimit(LIMITS.resendVerification, userId);
  await connectDb();
  const user = await User.findById(userId).lean();
  if (!user || user.emailVerifiedAt) return;
  await sendVerification(user, lang);
}

/** Always resolves the same way whether or not the email exists. */
export async function requestPasswordReset(email: string, ctx: { ip: string; lang: Lang }) {
  await hitLimit(LIMITS.forgotPassword, ctx.ip);
  await hitLimit(LIMITS.forgotPassword, email);
  await connectDb();
  const user = await User.findOne({ email, deletedAt: null }).lean();
  if (!user) return;
  const token = await issueToken(user._id, "reset_password");
  await sendEmail({
    to: user.email,
    lang: ctx.lang,
    template: "resetPassword",
    name: user.name,
    cta: { url: link(ctx.lang, `/reset-password?token=${token}`), label: emails[ctx.lang].resetPassword_cta },
  });
}

/** Sets a new password and bumps tokenVersion so every existing session is signed out. */
export async function resetPassword(token: string, password: string, ctx: { ip: string }) {
  await hitLimit(LIMITS.resetPassword, ctx.ip);
  const userId = await consumeToken(token, "reset_password");
  await connectDb();
  await User.updateOne(
    { _id: userId },
    { $set: { passwordHash: await hashPassword(password), emailVerifiedAt: new Date() }, $inc: { tokenVersion: 1 } },
  );
}

export async function changePassword(userId: string, current: string, next: string) {
  await connectDb();
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    throw new AppError("validation", "bad_password", { current: "wrongPassword" });
  }
  user.passwordHash = await hashPassword(next);
  user.tokenVersion += 1;
  await user.save();
  return user;
}

export async function updateProfile(userId: string, input: { name: string; phone: string; locale: Lang }) {
  await connectDb();
  await User.updateOne({ _id: userId }, { $set: input });
}

export async function revokeSessions(userId: string) {
  await connectDb();
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}
