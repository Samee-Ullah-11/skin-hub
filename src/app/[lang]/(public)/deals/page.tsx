import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sampleClinicCover } from "@config/sample-photos";
import { site } from "@config/site";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { fmt, isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { imageUrl } from "@/lib/cloudinary";
import { cloudinaryConfigured } from "@/lib/env";
import { formatDate, formatNumber } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { listTreatments } from "@/services/catalog";
import { listActiveDeals } from "@/services/deals";

export async function generateMetadata({ params }: PageProps<"/[lang]/deals">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = getDict(lang).deals;
  return pageMeta(lang, "/deals", d.title, d.intro);
}

export default async function DealsPage({ params, searchParams }: PageProps<"/[lang]/deals">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const d = t.deals;
  const wanted = (await searchParams).treatment;
  const treatmentSlug = typeof wanted === "string" ? wanted : undefined;
  const [deals, allDeals, treatments] = await Promise.all([
    listActiveDeals({ treatmentSlug }),
    listActiveDeals(),
    listTreatments({ activeOnly: true }),
  ]);
  // Only offer filter chips for treatments that have a deal right now.
  const withDeals = new Set(allDeals.map((x) => x.treatment.slug));
  const chips = treatments.filter((tr) => withDeals.has(tr.slug));
  const href = (p: string) => localePath(lang, p);
  const showImages = cloudinaryConfigured();

  return (
    <div className="flex flex-col pb-16">
      <section aria-labelledby="deals-title" className="relative -mt-20 overflow-hidden bg-chip pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="drift pointer-events-none absolute -top-24 end-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="container-page relative flex flex-col items-center gap-4 text-center">
          <p className="rise-in text-xs font-semibold uppercase tracking-[0.2em] text-primary">{d.eyebrow}</p>
          <h1 id="deals-title" className="rise-in delay-1 text-4xl md:text-5xl">
            {d.title}
          </h1>
          <p className="rise-in delay-2 max-w-2xl text-lg text-muted">{d.intro}</p>
        </div>
      </section>

      <div className="container-page flex flex-col gap-8 pt-8">
        {chips.length ? (
          <nav aria-label={d.title} className="flex flex-wrap gap-2">
            {[{ slug: "", name: d.all }, ...chips.map((tr) => ({ slug: tr.slug, name: pick(tr.name, lang) }))].map((c) => {
              const active = (treatmentSlug ?? "") === c.slug;
              return (
                <Link
                  key={c.slug || "all"}
                  href={href(c.slug ? `/deals?treatment=${c.slug}` : "/deals")}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    active ? "bg-primary text-on-primary" : "bg-surface text-ink shadow-sm hover:text-primary"
                  }`}
                >
                  {active ? <Icon name="check" size={16} /> : null}
                  {c.name}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {deals.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal, i) => {
              const photo = deal.clinic.photos[0];
              const clinicHref = href(`/clinic/${deal.clinic.slug}?treatment=${String(deal.treatment._id)}#book`);
              const place = [pick(deal.area, lang), pick(deal.city, lang)].filter(Boolean).join(", ");
              return (
                <li key={deal.id}>
                  <Reveal delay={(i % 3) * 100} className="h-full">
                    <article className="lift shadow-soft group/card flex h-full flex-col overflow-hidden rounded-3xl bg-surface">
                      <div className="relative aspect-[16/10] overflow-hidden bg-soft">
                        <Image
                          src={photo && showImages ? imageUrl(photo.publicId, { width: 640, height: 400 }) : sampleClinicCover(deal.clinic.slug)}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 ease-out group-hover/card:scale-105"
                        />
                        <span className="absolute start-3 top-3 rounded-full bg-danger px-3 py-1 text-sm font-bold text-white shadow">
                          -{deal.percentOff}%
                        </span>
                        {deal.isSample ? (
                          <span className="absolute end-3 top-3 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-semibold">{d.sample}</span>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{pick(deal.treatment.name, lang)}</p>
                        <h2 className="text-xl">{pick(deal.clinic.name, lang)}</h2>
                        {place ? (
                          <p className="flex items-center gap-1 text-sm text-muted">
                            <Icon name="pin" size={14} />
                            {place}
                          </p>
                        ) : null}
                        {deal.note ? <p className="text-sm">{deal.note}</p> : null}
                        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                          <div className="flex flex-col">
                            {deal.dealPrice !== null && deal.basePrice !== null ? (
                              <>
                                <span className="text-sm text-muted line-through">{fmt(d.was, { price: formatNumber(deal.basePrice, lang) })}</span>
                                <span className="text-lg font-bold text-primary">{fmt(d.now, { price: formatNumber(deal.dealPrice, lang) })}</span>
                              </>
                            ) : (
                              <span className="font-semibold text-primary">{fmt(d.percentOnly, { percent: deal.percentOff })}</span>
                            )}
                            <span className="text-xs text-muted">{fmt(d.endsOn, { date: formatDate(deal.endsAt, lang) })}</span>
                          </div>
                          <Link
                            href={clinicHref}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:brightness-110"
                          >
                            {d.book}
                            <Icon name="arrowRight" size={14} className="rtl:rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-soft p-10 text-center">
            <p className="text-muted">{d.none}</p>
            <LinkButton href={href(`/clinics/${site.defaultCitySlug}`)} className="rounded-full">
              {d.browseClinics}
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}
