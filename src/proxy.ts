import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";
import { stripLocale } from "@/i18n/config";
import type { Role } from "@/models/User";

const AREA_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/account", roles: ["patient"] },
  { prefix: "/dashboard", roles: ["clinic_owner"] },
  { prefix: "/admin", roles: ["admin"] },
];

function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "clinic_owner") return "/dashboard";
  return "/account/bookings";
}

function originAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    const isCron = pathname.startsWith("/api/cron/");
    if (!isCron && !["GET", "HEAD", "OPTIONS"].includes(req.method) && !originAllowed(req)) {
      return NextResponse.json({ error: "bad_origin" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = stripLocale(pathname);
    return NextResponse.redirect(url, 308);
  }

  // The Urdu version is switched off: old /ur links go to the English page.
  if (pathname === "/ur" || pathname.startsWith("/ur/")) {
    const url = req.nextUrl.clone();
    url.pathname = stripLocale(pathname);
    return NextResponse.redirect(url, 308);
  }

  const bare = stripLocale(pathname);

  const area = AREA_ROLES.find((a) => bare === a.prefix || bare.startsWith(`${a.prefix}/`));
  if (area) {
    const claims = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!claims) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(bare + search)}`;
      return NextResponse.redirect(url);
    }
    if (!area.roles.includes(claims.role)) {
      const url = req.nextUrl.clone();
      url.pathname = homeFor(claims.role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const headers = new Headers(req.headers);
  headers.set("x-pathname", bare);

  const url = req.nextUrl.clone();
  url.pathname = bare === "/" ? "/en" : `/en${bare}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
