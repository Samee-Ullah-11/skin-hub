import type { Lang } from "@/i18n/config";

const TZ = "Asia/Karachi";

function locale(lang: Lang) {
  return lang === "ur" ? "ur-PK" : "en-PK";
}

export function formatDateTime(d: Date | string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));
}

export function formatDate(d: Date | string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return new Intl.DateTimeFormat(locale(lang), { timeZone: TZ, ...opts }).format(new Date(d));
}

export function formatTime(d: Date | string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(d));
}

/** Formats a calendar date key (YYYY-MM-DD) without shifting it across time zones. */
export function formatDateKey(key: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(locale(lang), { timeZone: "UTC", ...opts }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function formatNumber(n: number, lang: Lang): string {
  return new Intl.NumberFormat(locale(lang)).format(n);
}

/** Wall-clock "HH:mm" shown in the user's locale. */
export function formatClock(hhmm: string, lang: Lang): string {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(locale(lang), { timeZone: "UTC", hour: "numeric", minute: "2-digit" }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}
