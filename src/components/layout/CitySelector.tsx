"use client";

import { useRouter } from "next/navigation";
import { localePath, type Lang } from "@/i18n/config";

export interface CityOption {
  slug: string;
  name: string;
  active: boolean;
}

export function CitySelector({
  lang,
  cities,
  current,
  label,
}: {
  lang: Lang;
  cities: CityOption[];
  current: string;
  label: string;
}) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-2 text-[15px]">
      <span className="sr-only">{label}</span>
      <select
        className="h-10 max-w-40 rounded-md border border-line bg-surface px-2 text-ink"
        value={current}
        onChange={(e) => {
          const slug = e.target.value;
          document.cookie = `city=${slug}; path=/; max-age=31536000; samesite=lax`;
          router.push(localePath(lang, `/clinics/${slug}`));
        }}
      >
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
