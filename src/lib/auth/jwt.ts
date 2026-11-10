import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/models/User";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 3600;

export interface SessionClaims {
  sub: string;
  role: Role;
  tv: number;
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
    if (typeof payload.sub !== "string" || typeof payload.role !== "string" || typeof payload.tv !== "number") {
      return null;
    }
    return { sub: payload.sub, role: payload.role as Role, tv: payload.tv };
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
