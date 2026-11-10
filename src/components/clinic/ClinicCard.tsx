import Image from "next/image";
import { sampleClinicCover } from "@config/sample-photos";
import Link from "next/link";
import { Chip, FeaturedBadge } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import type { Dict } from "@/i18n";
import { fmt, localePath, pick, type Lang } from "@/i18n/config";
import { imageUrl } from "@/lib/cloudinary";
import { cloudinaryConfigured } from "@/lib/env";
import { formatNumber } from "@/lib/format";
import type { ClinicDoc } from "@/models/Clinic";
import type { Localized } from "@/models/shared";
import { isFeatured } from "@/services/clinics";
import { LikeButton, type LikeMode } from "./LikeButton";

export interface CardContext {
  areas: Map<string, Localized>;
  cities: Map<string, Localized>;
  treatments: Map<string, Localized>;
  likes: { count: Map<string, number>; liked: Set<string> };
  likeMode: LikeMode;
}

/** Clinic card: photo with a heart button in its corner, then name, place and starting price. */
export function ClinicCard({ lang, t, clinic, ctx }: { lang: Lang; t: Dict; clinic: ClinicDoc; ctx: CardContext }) {
  const id = String(clinic._id);
  const href = localePath(lang, `/clinic/${clinic.slug}`);
  const name = pick(clinic.name, lang);
  const photo = clinic.photos[0];
  const prices = clinic.treatments.map((x) => x.fromPricePkr).filter((p): p is number => typeof p === "number");
  const place = [pick(ctx.areas.get(String(clinic.areaId)), lang), pick(ctx.cities.get(String(clinic.cityId)), lang)].filter(Boolean).join(", ");

  return (
    <article className="lift shadow-soft group/card flex h-full flex-col overflow-hidden rounded-3xl bg-surface">
      <div className="relative bg-soft">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          {photo && cloudinaryConfigured() ? (
            <Image
              src={imageUrl(photo.publicId, { width: 600, height: 450 })}
              alt=""
              width={600}
              height={450}
              unoptimized
              className="aspect-[4/3] w-full object-cover"
            />
          ) : clinic.isSample ? (
            <Image
              src={sampleClinicCover(clinic.slug)}
              alt=""
              width={600}
              height={450}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-muted">
              <Icon name="pin" size={32} />
            </div>
          )}
        </Link>
        <div className="absolute end-3 top-3">
          <LikeButton
            clinicId={id}
            initialLiked={ctx.likes.liked.has(id)}
            initialCount={ctx.likes.count.get(id) ?? 0}
            mode={ctx.likeMode}
            labels={{ like: t.home.like, liked: t.home.liked }}
          />
        </div>
        {/* Booking button: slides up on hover or keyboard focus; always shown on touch screens. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover/card:pointer-events-auto group-hover/card:opacity-100 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
          <Link
            href={`${href}#book`}
            className="inline-flex translate-y-3 items-center gap-2 rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-ink shadow-lg transition-transform duration-300 group-hover/card:translate-y-0 group-focus-within/card:translate-y-0 hover:bg-primary hover:text-on-primary [@media(hover:none)]:translate-y-0"
          >
            <Icon name="clock" size={16} />
            {t.clinicPage.bookThis}
          </Link>
        </div>
        {isFeatured(clinic) ? (
          <div className="absolute start-3 top-3">
            <FeaturedBadge label={t.common.featured} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="text-xl">
          <Link href={href} className="hover:text-primary">
            {name}
          </Link>
        </h3>
        {place ? <p className="text-sm text-muted">{place}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-sm">
          {clinic.isSample ? <Chip>{t.common.sample}</Chip> : null}
          {prices.length ? <span className="font-semibold text-primary">{fmt(t.common.fromPkr, { amount: formatNumber(Math.min(...prices), lang) })}</span> : null}
        </div>
      </div>
    </article>
  );
}
