import type { MetadataRoute } from "next";
import { localePath, type Lang } from "@/i18n/config";
import { env } from "@/lib/env";
import { listPublicSlugs } from "@/services/clinics";
import { listCities } from "@/services/locations";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env().APP_URL;
  const entry = (path: string, lastModified?: Date): MetadataRoute.Sitemap[number] => ({
    url: `${base}${localePath("en", path)}`,
    lastModified,
    alternates: {
      languages: Object.fromEntries((["en"] as Lang[]).map((l) => [l, `${base}${localePath(l, path)}`])),
    },
  });

  const [clinics, cities] = await Promise.all([listPublicSlugs(), listCities({ activeOnly: true })]);
  return [
    entry("/"),
    entry("/treatments"),
    entry("/about"),
    entry("/contact"),
    entry("/privacy"),
    entry("/terms"),
    entry("/medical-disclaimer"),
    ...cities.map((c) => entry(`/clinics/${c.slug}`)),
    ...clinics.map((c) => entry(`/clinic/${c.slug}`, c.updatedAt)),
  ];
}
