import { NextResponse } from "next/server";
import { features } from "@config/features";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { route } from "@/lib/http";
import { expireStale, sendTomorrowReminders } from "@/services/bookings";
import { purgeExpiredDocuments } from "@/services/documents";

/**
 * Runs once a day (Vercel Hobby allows one daily cron). Cleanup only: nothing in the app depends on it,
 * because booking expiry and featured status are computed when pages are read.
 */
export const GET = route(async (req) => {
  const secret = env().CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const expired = await expireStale();
  const purged = await purgeExpiredDocuments().catch((err) => {
    logger.error("document purge failed", { error: err });
    return -1;
  });
  const reminders = features.dailyReminders ? await sendTomorrowReminders() : 0;
  logger.info("daily cron finished", { expired, purged, reminders });
  return NextResponse.json({ expired, purged, reminders });
});
