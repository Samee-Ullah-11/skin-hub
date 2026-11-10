import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { route } from "@/lib/http";
import { adminDocumentUrl } from "@/services/documents";

export const GET = route(async (_req, ctx: RouteContext<"/api/admin/documents/[id]">) => {
  const user = await requireUser("admin");
  const { id } = await ctx.params;
  const url = await adminDocumentUrl(user.id, id);
  const res = NextResponse.redirect(url, 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
});
