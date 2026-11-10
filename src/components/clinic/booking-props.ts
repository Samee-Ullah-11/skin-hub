import type { Dict } from "@/i18n";
import type { Lang } from "@/i18n/config";
import type { SessionUser } from "@/lib/auth/session";
import { formatDateKey } from "@/lib/format";
import { addDays, zonedDateKey } from "@/services/schedule";
import type { BookingLabels } from "./BookingWidget";

export function bookingLabels(t: Dict): BookingLabels {
  return {
    ...t.slots,
    note: t.clinicPage.note,
    noteHint: t.clinicPage.noteHint,
    requestButton: t.clinicPage.requestButton,
    loginToBook: t.clinicPage.loginToBook,
    signupToBook: t.clinicPage.signupToBook,
    verifyToBook: t.clinicPage.verifyToBook,
    verifyNow: t.clinicPage.verifyNow,
    clinicCannotBook: t.clinicPage.clinicCannotBook,
    goToBookings: t.clinicPage.goToBookings,
  };
}

export function viewerKind(user: SessionUser | null) {
  if (!user) return "anonymous" as const;
  if (user.role !== "patient") return "other" as const;
  return user.emailVerified ? ("patient" as const) : ("unverified" as const);
}

export function dayLabelMap(lang: Lang, days: number, now = new Date()): Record<string, string> {
  const today = zonedDateKey(now);
  const out: Record<string, string> = {};
  for (let i = 0; i < days; i++) {
    const key = addDays(today, i);
    out[key] = formatDateKey(key, lang);
  }
  return out;
}
