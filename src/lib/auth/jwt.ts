import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/models/User";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 3600;

export interface SessionClaims {
  sub: string;
  role: Role;
  tv: number;
  /** Issued at, in seconds; set when the token is signed. */
  iat?: number;
}

/** A sign-in ends after this long without a page load; patients keep the 30-day cap. */
export function idleSeconds(role: Role): number {
  return role === "patient" ? SESSION_MAX_AGE_SECONDS : 60 * 60;
}

export function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "clinic_owner") return "/dashboard";
  return "/account/bookings";
}

function key() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET missing or shorter than 32 characters");
  return new TextEncoder().encode(secret);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, tv: claims.tv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.role !== "string" || typeof payload.tv !== "number" || typeof payload.iat !== "number") {
      return null;
    }
    const role = payload.role as Role;
    if (Date.now() / 1000 - payload.iat > idleSeconds(role)) return null;
    return { sub: payload.sub, role, tv: payload.tv, iat: payload.iat };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
