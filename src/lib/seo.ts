import type { Metadata } from "next";
import { site } from "@config/site";
import { localePath, type Lang } from "@/i18n/config";

/** Canonical URL plus hreflang links for both languages of the same page. */
export function pageMeta(lang: Lang, path: string, title: string, description: string, opts: { absoluteTitle?: boolean } = {}): Metadata {
  const canonical = localePath(lang, path);
  return {
    title: opts.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages: { en: localePath("en", path), "x-default": localePath("en", path) },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: site.name,
      locale: lang === "ur" ? "ur_PK" : "en_PK",
      alternateLocale: lang === "ur" ? "en_PK" : "ur_PK",
      type: "website",
    },
  };
}
