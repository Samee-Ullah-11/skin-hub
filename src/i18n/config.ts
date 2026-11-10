export const LANGS = ["en", "ur"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "lang";

/** Languages the site currently serves. Urdu dictionaries are kept but the Urdu version is switched off. */
export const ENABLED_LANGS: readonly Lang[] = ["en"];

export function isLang(value: string | undefined | null): value is Lang {
  return ENABLED_LANGS.includes(value as Lang);
}

export function dirOf(lang: Lang): "ltr" | "rtl" {
  return lang === "ur" ? "rtl" : "ltr";
}

export function localePath(lang: Lang, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === "en") return clean;
  return clean === "/" ? "/ur" : `/ur${clean}`;
}

export function stripLocale(pathname: string): string {
  if (pathname === "/ur" || pathname === "/en") return "/";
  if (pathname.startsWith("/ur/") || pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}

export function fmt(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in params ? String(params[key]) : `{${key}}`));
}

export function pick(value: { en: string; ur?: string } | undefined, lang: Lang): string {
  if (!value) return "";
  if (lang === "ur" && value.ur && value.ur.trim()) return value.ur;
  return value.en;
}
