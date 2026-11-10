import { NextResponse } from "next/server";
import { isLang } from "@/i18n/config";
import { getSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { formatClock } from "@/lib/format";
import { route } from "@/lib/http";
import { slotsForDoctor } from "@/services/bookings";
import { objectId } from "@/validation/common";

export const GET = route(async (req) => {
  const url = new URL(req.url);
  const parsed = objectId.safeParse(url.searchParams.get("doctorId"));
  if (!parsed.success) throw new AppError("not_found");
  const langParam = url.searchParams.get("lang");
  const lang = isLang(langParam) ? langParam : "en";
  const viewer = await getSessionUser();
  const days = await slotsForDoctor(parsed.data, viewer?.id);
  return NextResponse.json(
    {
      days: days.map((d) => ({
        date: d.date,
        blocked: d.blocked,
        slots: d.slots.map((s) => ({ startUtc: s.startUtc.toISOString(), time: s.time, label: formatClock(s.time, lang), state: s.state })),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
