import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { User, type Role } from "@/models/User";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "./jwt";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  emailVerified: boolean;
  locale: "en" | "ur";
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const claims = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  await connectDb();
  const user = await User.findById(claims.sub).lean();
  if (!user || user.deletedAt || user.disabledAt || user.tokenVersion !== claims.tv || user.role !== claims.role) {
    return null;
  }
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    locale: user.locale,
  };
});

export async function requireUser(...roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("unauthenticated");
  if (roles.length > 0 && !roles.includes(user.role)) throw new AppError("forbidden");
  return user;
}

export async function startSession(user: { _id: unknown; role: Role; tokenVersion: number }) {
  const token = await signSession({ sub: String(user._id), role: user.role, tv: user.tokenVersion });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
