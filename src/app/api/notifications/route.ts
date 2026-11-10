import { NextResponse } from "next/server";
import { isLang, localePath } from "@/i18n/config";
import { requireUser } from "@/lib/auth/session";
import { route } from "@/lib/http";
import { listNotifications, markAllRead, renderNotification } from "@/services/notifications";

export const GET = route(async (req) => {
  const user = await requireUser();
  const langParam = new URL(req.url).searchParams.get("lang");
  const lang = isLang(langParam) ? langParam : "en";
  const { items, unread } = await listNotifications(user.id);
  return NextResponse.json(
    {
      unread,
      items: items.map((n) => ({
        id: String(n._id),
        text: renderNotification(lang, n.type, n.params as Record<string, string>),
        link: localePath(lang, n.link || "/"),
        read: Boolean(n.readAt),
        createdAt: n.createdAt,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});

export const POST = route(async () => {
  const user = await requireUser();
  await markAllRead(user.id);
  return NextResponse.json({ ok: true });
});
