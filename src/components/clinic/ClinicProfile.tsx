import Image from "next/image";
import { sampleClinicCover, sampleClinicGallery } from "@config/sample-photos";
import type { ReactNode } from "react";
import { site } from "@config/site";
import { Card } from "@/components/ui/Card";
import { Chip, FeaturedBadge } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";
import type { Dict } from "@/i18n";
import { fmt, pick, type Lang } from "@/i18n/config";
import { cloudinaryConfigured } from "@/lib/env";
import { imageUrl } from "@/lib/cloudinary";
import { formatClock, formatNumber } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { ClinicDoc } from "@/models/Clinic";
import type { getClinicDisplayData } from "@/services/clinics";
import { isFeatured } from "@/services/clinics";
import { clinicHours } from "@/services/schedule";
import { MapView } from "./MapView";
import { Gallery, type GalleryItem } from "./Gallery";
import { TreatmentList } from "./TreatmentList";

type Display = Awaited<ReturnType<typeof getClinicDisplayData>>;

/** The one clinic page layout, used by the public profile and by the owner/admin preview. */
export function ClinicProfile({
  lang,
  t,
  clinic,
  display,
  booking,
  deals,
  embedded = false,
}: {
  lang: Lang;
  t: Dict;
  clinic: ClinicDoc;
  display: Display;
  booking: ReactNode;
  /** Running deals by treatment ID (percent off). */
  deals?: Map<string, { percentOff: number; endsAt: Date }>;
  /** Inside the dashboard preview: no full-bleed banner under the navbar. */
  embedded?: boolean;
}) {
  const c = t.clinicPage;
  const name = pick(clinic.name, lang);
  const hours = clinicHours(display.doctors);
  const priceOf = new Map(clinic.treatments.map((x) => [String(x.treatmentId), x.fromPricePkr]));
  const images = cloudinaryConfigured() ? clinic.photos : [];
  const coords = clinic.location?.coordinates;
  const waText = fmt(c.whatsappText, { clinic: clinic.name.en, site: site.name });
  const days = t.dashboard.days;
  const cover = images[0];
  // Sample clinics get an illustrated SAMPLE banner so the layout can be previewed without real photos.
  // Sample clinics show SAMPLE photos so the layout can be previewed without real uploads.
  const sampleCover = clinic.isSample ? sampleClinicCover(clinic.slug) : undefined;
  const place = [pick(display.area?.name, lang), pick(display.city?.name, lang)].filter(Boolean).join(", ");

  const gallery: GalleryItem[] = images.length
    ? images.slice(0, 9).map((p) => ({ src: imageUrl(p.publicId, { width: 1200, height: 900 }), alt: p.alt || fmt(c.photosOf, { clinic: name }) }))
    : clinic.isSample
      ? sampleClinicGallery(clinic.slug).map((src) => ({ src, alt: c.samplePhoto, sample: true }))
      : [];

  return (
    <article className="flex flex-col pb-16">
      {/* Banner: the clinic photo fades into the page; the clinic's name sits on the faded part. */}
      <header className={`relative flex min-h-[21rem] flex-col justify-end overflow-hidden ${embedded ? "" : "-mt-20"} h-[min(52svh,36rem)] md:min-h-[26rem] md:h-[min(68svh,36rem)]`}>
        {cover ? (
          <Image src={imageUrl(cover.publicId, { width: 1920, height: 900 })} alt="" fill priority unoptimized className="object-cover" />
        ) : sampleCover ? (
          <Image src={sampleCover} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="hero-bg absolute inset-0" aria-hidden="true">
            <div className="drift absolute -top-20 start-1/4 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
            <div className="drift-slow absolute top-10 end-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--page)_55%,transparent)] to-page" aria-hidden="true" />
        <div className="container-page relative grid gap-8 pb-8 lg:grid-cols-[1fr_420px]">
          <div className="rise-in flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {isFeatured(clinic) ? <FeaturedBadge label={t.common.featured} /> : null}
              {display.category ? <Chip>{pick(display.category.name, lang)}</Chip> : null}
              {clinic.isSample ? <Chip>{t.common.sample}</Chip> : null}
            </div>
            <h1 className="text-4xl md:text-5xl">{name}</h1>
            {place ? (
              <p className="flex items-center gap-1 text-muted">
                <Icon name="pin" size={16} />
                {place}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              {clinic.whatsapp ? (
                <a href={waLink(clinic.whatsapp, waText)} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md", "rounded-full")}>
                  <Icon name="chat" size={18} />
                  {c.whatsappClinic}
                </a>
              ) : null}
              {clinic.phone ? (
                <a href={`tel:${clinic.phone}`} className={buttonClass("secondary", "md", "rounded-full")} dir="ltr">
                  <Icon name="phone" size={18} />
                  {clinic.phone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-y-12">
        {/* Order: treatments first (what patients come for), then booking, then photos, doctors, about, hours, map.
            On desktop the booking card sits beside everything, raised into the banner. */}
        <section aria-labelledby="treatments" className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h2 id="treatments" className="text-2xl">
            {c.treatments}
          </h2>
          <p className="mb-4 text-sm text-muted">{c.treatmentHint}</p>
          <TreatmentList
            bookLabel={c.bookThis}
            items={display.treatments.map((tr) => {
              const price = priceOf.get(String(tr._id));
              const deal = deals?.get(String(tr._id));
              const dealPrice = deal && typeof price === "number" ? Math.round((price * (100 - deal.percentOff)) / 100 / 50) * 50 : undefined;
              return {
                id: String(tr._id),
                name: pick(tr.name, lang),
                onRequest: typeof price !== "number",
                price: typeof price === "number" ? fmt(t.common.fromPkr, { amount: formatNumber(price, lang) }) : c.priceOnRequest,
                deal: deal
                  ? {
                      badge: `-${deal.percentOff}%`,
                      price: dealPrice !== undefined ? fmt(t.common.fromPkr, { amount: formatNumber(dealPrice, lang) }) : undefined,
                    }
                  : undefined,
              };
            })}
          />
        </section>

        <aside
          aria-labelledby="book"
          className="relative z-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-mt-72 lg:self-start lg:sticky lg:top-24"
        >
          <div className="shadow-soft flex flex-col gap-4 rounded-[2rem] bg-surface p-5 md:p-6">
            <h2 id="book" className="scroll-mt-28 text-2xl">
              {c.book}
            </h2>
            {booking}
            <p className="border-t border-line pt-3 text-sm text-muted">{fmt(t.common.medicalDisclaimer, { site: site.name })}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-12 lg:col-start-1 lg:row-start-2">


          <section aria-labelledby="gallery">
            <h2 id="gallery" className="mb-4 text-2xl">
              {c.gallery}
            </h2>
            {gallery.length ? (
              <Gallery items={gallery} closeLabel={c.closeGallery} placeholderLabel={c.samplePhoto} />
            ) : (
              <p className="rounded-2xl bg-soft p-6 text-muted">{c.noPhotos}</p>
            )}
          </section>

          <section aria-labelledby="doctors">
            <h2 id="doctors" className="mb-3 text-2xl">
              {c.doctors}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {display.doctors.map((d) => (
                <li key={String(d._id)}>
                  <Card className="shadow-soft flex gap-3 rounded-2xl border-0 p-4">
                    {d.photo && cloudinaryConfigured() ? (
                      <Image
                        src={imageUrl(d.photo.publicId, { width: 128, height: 128 })}
                        alt={pick(d.name, lang)}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 shrink-0 rounded-md object-cover"
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold">{pick(d.name, lang)}</p>
                      {d.specialty?.en ? <p className="text-sm text-muted">{pick(d.specialty, lang)}</p> : null}
                      {d.qualifications ? (
                        <p className="text-sm" dir="ltr">
                          {d.qualifications}
                        </p>
                      ) : null}
                      {d.bio?.en ? <p className="mt-1 text-sm">{pick(d.bio, lang)}</p> : null}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="about">
            <h2 id="about" className="mb-3 text-2xl">
              {c.about}
            </h2>
            <p className="whitespace-pre-line text-[17px]">{pick(clinic.description, lang)}</p>
          </section>

          <section aria-labelledby="hours">
            <h2 id="hours" className="mb-3 text-2xl">
              {c.hours}
            </h2>
            <dl className="grid max-w-md grid-cols-2 gap-y-1">
              {[1, 2, 3, 4, 5, 6, 0].map((w) => {
                const h = hours.find((x) => x.weekday === w);
                return (
                  <div key={w} className="contents">
                    <dt className="text-muted">{days[w]}</dt>
                    <dd dir="ltr" className="text-end md:text-start">
                      {h ? `${formatClock(h.start, lang)} – ${formatClock(h.end, lang)}` : c.closed}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          {coords?.length === 2 ? (
            <section aria-labelledby="location">
              <h2 id="location" className="mb-3 text-2xl">
                {c.location}
              </h2>
              <p className="mb-3">{pick(clinic.address, lang)}</p>
              <MapView lat={coords[1]} lng={coords[0]} label={`${c.location}: ${name}`} />
              <a
                className="link mt-2 inline-block text-sm"
                href={`https://www.openstreetmap.org/?mlat=${coords[1]}&mlon=${coords[0]}#map=17/${coords[1]}/${coords[0]}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.directions}
              </a>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
