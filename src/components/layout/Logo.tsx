import Image from "next/image";
import Link from "next/link";
import { isPlaceholder, site } from "@config/site";
import { localePath, type Lang } from "@/i18n/config";

export function Logo({ lang }: { lang: Lang }) {
  return (
    <Link href={localePath(lang, "/")} className="inline-flex items-center gap-2" aria-label={site.name}>
      {isPlaceholder(site.logo.src) ? (
        <span className="font-display text-xl font-semibold text-primary" lang="en" dir="ltr">
          {site.name}
        </span>
      ) : (
        <Image src={site.logo.src} alt={site.name} width={site.logo.width} height={site.logo.height} priority />
      )}
    </Link>
  );
}
