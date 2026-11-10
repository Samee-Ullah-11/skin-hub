import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { isPlaceholder, site } from "@config/site";
import { ClinicCard } from "@/components/clinic/ClinicCard";
import { ClinicTabs } from "@/components/clinic/ClinicTabs";
import { TreatmentShowcase } from "@/components/home/TreatmentShowcase";
import { TrustCards } from "@/components/home/TrustCards";
import { HeroSlider } from "@/components/layout/HeroSlider";
import { NewsletterForm } from "@/components/layout/PublicForms";
import { TestimonialRow } from "@/components/layout/TestimonialRow";
import { LinkButton } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { fmt, isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";
import { formatNumber } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { treatmentIcon } from "@/lib/treatment-icons";
import { treatmentImage } from "@/lib/treatment-image";
import { listTreatments } from "@/services/catalog";
import { featuredClinics, isFeatured, treatmentOffers } from "@/services/clinics";
import { listTestimonials } from "@/services/engagement";
import { listCities } from "@/services/locations";
import { cardContext } from "@/services/public";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang).home;
  return pageMeta(lang, "/", `${site.name}: ${t.metaTitle}`, t.metaDescription, { absoluteTitle: true });
}

/** Small uppercase line above a section title, then the title, then an optional action on the side. */
function SectionHead({ id, eyebrow, title, subtitle, action }: { id: string; eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-2">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p> : null}
        <h2 id={id} className="text-3xl md:text-4xl">
          {title}
        </h2>
        {subtitle ? <p className="text-[17px] text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function Picture({ src, icon, className = "" }: { src: string; icon: "user" | "pin"; className?: string }) {
  if (isPlaceholder(src)) {
    return (
      <div className={`flex items-center justify-center bg-chip text-primary/50 ${className}`} aria-hidden="true">
        <Icon name={icon} size={56} />
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      <Image src={src} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
    </div>
  );
}

/** A full-screen module: content is centred and sized to fit one viewport on desktop. */
function Screen({ id, labelledBy, className = "", children }: { id?: string; labelledBy: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`screen flex flex-col justify-center py-10 lg:py-14 ${className}`}>
      <div className="container-page flex flex-col gap-8">{children}</div>
    </section>
  );
}


export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const h = t.home;
  const s = t.showcase;
  const href = (p: string) => localePath(lang, p);
  const citySlug = (await cookies()).get("city")?.value ?? site.defaultCitySlug;

  const [user, treatments, clinics, testimonials, offers, cities] = await Promise.all([
    getSessionUser(),
    listTreatments({ activeOnly: true }),
    featuredClinics(9),
    listTestimonials({ activeOnly: true }),
    treatmentOffers(),
    listCities(),
  ]);
  const ctx = await cardContext(clinics, user);
  const isPatient = user?.role === "patient";
  const cityName = pick(cities.find((c) => c.slug === citySlug)?.name, lang) || citySlug;
  const bySlug = new Map(treatments.map((tr) => [tr.slug, tr]));

  // Hero slides: copy from the dictionary, numbers from live clinic data.
  const slides = s.slides.map((sl) => {
    const tr = bySlug.get(sl.treatment);
    const offer = tr ? offers.get(String(tr._id)) : undefined;
    const spotlight = !offer
      ? s.spotlightSoon
      : offer.minPrice !== null
        ? fmt(offer.clinics === 1 ? s.spotlightOne : s.spotlightClinics, { count: offer.clinics, price: formatNumber(offer.minPrice, lang) })
        : fmt(offer.clinics === 1 ? s.spotlightOneNoPrice : s.spotlightClinicsNoPrice, { count: offer.clinics });
    return {
      eyebrow: sl.eyebrow,
      title: sl.title,
      body: sl.body,
      cta: sl.cta,
      art: sl.art,
      href: href(`/clinics/${citySlug}?treatment=${sl.treatment}`),
      spotlight,
    };
  });

  const tabbed = clinics.map((c) => {
    const prices = c.treatments.map((x) => x.fromPricePkr).filter((p): p is number => typeof p === "number");
    return {
      id: String(c._id),
      card: <ClinicCard lang={lang} t={t} clinic={c} ctx={ctx} />,
      featured: isFeatured(c),
      likes: ctx.likes.count.get(String(c._id)) ?? 0,
      minPrice: prices.length ? Math.min(...prices) : null,
    };
  });

  const arrow = <Icon name="arrowRight" size={18} className="rtl:rotate-180" />;
  const promoArt = ["/hero/slide-3.svg", "/hero/slide-1.svg", "/hero/slide-2.svg"];

  return (
    <>
      {/* 1. Hero slideshow */}
      <HeroSlider
        slides={slides}
        greeting={isPatient ? fmt(h.welcomeBack, { name: user.name.split(" ")[0] }) : undefined}
        trust={s.heroTrust}
        labels={{ prev: s.prevSlide, next: s.nextSlide, goTo: s.goToSlide, spotlight: s.spotlight }}
        secondary={
          <Link
            href={isPatient ? href("/account/bookings") : user ? href("/dashboard") : "#join"}
            className="inline-flex h-12 items-center rounded-full border border-white/30 px-6 font-semibold text-white transition-colors hover:bg-white/10"
          >
            {isPatient ? h.seeBookings : user ? t.nav.dashboard : h.heroJoin}
          </Link>
        }
      />

      {/* 2. Registration (visitors only) */}
      {user ? null : (
        <Screen id="join" labelledBy="join-title" className="overflow-hidden">
          <Reveal>
            <SectionHead id="join-title" title={h.joinTitle} subtitle={h.joinSubtitle} />
          </Reveal>
          <div className="flex flex-col gap-5">
            <Reveal from="left">
              <article data-role="public" className="shadow-soft grid overflow-hidden rounded-[2rem] bg-surface md:grid-cols-[2fr_3fr]">
                <Picture src={site.heroImages.patient} icon="user" className="h-40 md:h-full md:min-h-44" />
                <div className="flex flex-col items-start justify-center gap-3 p-6 md:px-10 md:py-7">
                  <span className="rounded-full bg-chip px-3 py-1 text-sm font-semibold text-chip-ink">{h.forPatients}</span>
                  <h3 className="text-2xl">{h.patientTitle}</h3>
                  <p className="max-w-xl text-muted">{h.patientBody}</p>
                  <LinkButton href={href("/signup")} size="lg" className="mt-2 rounded-full">
                    {h.signupCta}
                    {arrow}
                  </LinkButton>
                </div>
              </article>
            </Reveal>
            <Reveal from="right" delay={150}>
              <article data-role="clinic" className="shadow-soft grid overflow-hidden rounded-[2rem] bg-surface md:grid-cols-[3fr_2fr]">
                <div className="order-2 flex flex-col items-start justify-center gap-3 p-6 md:order-1 md:px-10 md:py-8">
                  <span className="rounded-full bg-chip px-3 py-1 text-sm font-semibold text-chip-ink">{h.forClinics}</span>
                  <h3 className="text-2xl">{h.clinicTitle}</h3>
                  <p className="max-w-xl text-muted">{h.clinicBody}</p>
                  <LinkButton href={href("/signup?as=clinic")} size="lg" className="mt-2 rounded-full">
                    {t.nav.register}
                    {arrow}
                  </LinkButton>
                </div>
                <Picture src={site.heroImages.clinic} icon="pin" className="order-1 h-40 md:order-2 md:h-full md:min-h-44" />
              </article>
            </Reveal>
          </div>
        </Screen>
      )}

      {/* 3. Browse by treatment */}
      <Screen labelledBy="browse-title" className="bg-soft">
        <Reveal>
          <TreatmentShowcase
            titleId="browse-title"
            title={s.browseTitle}
            action={
              <Link href={href("/treatments")} className="inline-flex items-center gap-2 font-semibold text-white hover:underline">
                {h.exploreServices}
                {arrow}
              </Link>
            }
            items={treatments.slice(0, 8).map((tr) => {
              const offer = offers.get(String(tr._id));
              return {
                slug: tr.slug,
                name: pick(tr.name, lang),
                label: !offer ? s.comingSoon : offer.clinics === 1 ? s.clinicCountOne : fmt(s.clinicCount, { count: offer.clinics }),
                href: href(`/clinics/${citySlug}?treatment=${tr.slug}`),
                image: treatmentImage(tr).src,
                icon: treatmentIcon(tr.slug),
              };
            })}
          />
        </Reveal>
      </Screen>

      {/* 4. Clinics with filter tabs */}
      <Screen labelledBy="clinics-title">
        <Reveal>
          <SectionHead
            id="clinics-title"
            eyebrow={s.clinicsEyebrow}
            title={h.clinicsTitle}
            subtitle={h.clinicsSubtitle}
            action={
              <LinkButton href={href(`/clinics/${citySlug}`)} size="lg" className="self-start rounded-full sm:self-auto">
                {h.startBooking}
                <Icon name="chevronRight" size={18} className="rtl:rotate-180" />
              </LinkButton>
            }
          />
        </Reveal>
        {tabbed.length ? (
          <ClinicTabs
            clinics={tabbed}
            labels={{ all: s.tabAll, featured: s.tabFeatured, saved: s.tabSaved, price: s.tabPrice, empty: s.tabEmpty }}
          />
        ) : (
          <p className="rounded-3xl bg-soft p-8 text-center text-muted">{h.noClinicsYet}</p>
        )}
      </Screen>

      {/* 5. Promo banners and trust boxes */}
      <Screen labelledBy="trust-title" className="bg-soft">
        <ul className={`grid gap-5 ${user ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {s.promos.filter((p) => !(user && p.href.startsWith("/signup"))).map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 120} className="h-full">
                <Link
                  href={href(p.href)}
                  className="lift group relative flex h-full min-h-60 flex-col justify-end overflow-hidden rounded-[2rem] p-6 text-white"
                >
                  <Image src={promoArt[i]} alt="" fill unoptimized className="object-cover transition-transform duration-300 ease-out group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" aria-hidden="true" />
                  <span className="relative flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7fd6ff]">{p.eyebrow}</span>
                    <span className="text-2xl font-semibold leading-tight">{p.title}</span>
                    <span className="text-sm text-white/80">{p.body}</span>
                    <span className="mt-2 inline-flex items-center gap-2 font-semibold">
                      {p.cta}
                      <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal>
          <SectionHead id="trust-title" eyebrow={s.trustEyebrow} title={s.trustTitle} />
        </Reveal>
        <Reveal>
          <TrustCards items={s.trust.map((x) => ({ icon: x.icon as IconName, title: x.title, body: x.body }))} />
        </Reveal>
      </Screen>

      {/* 6. Testimonials */}
      <Screen labelledBy="testimonials-title">
        <Reveal>
          <SectionHead id="testimonials-title" title={h.testimonialsTitle} />
        </Reveal>
        <Reveal from="right">
          {testimonials.length ? (
            <TestimonialRow
              items={testimonials.map((x) => ({ id: String(x._id), name: x.name, quote: pick(x.quote, lang) }))}
            />
          ) : (
            <p className="rounded-3xl bg-soft p-8 text-muted">{h.testimonialsEmpty}</p>
          )}
        </Reveal>
      </Screen>

      {/* 7. Newsletter (the contact form lives on its own page now) */}
      <section aria-labelledby="newsletter-title" className="py-16 md:py-24">
        <div className="container-page">
          <Reveal>
            <div className="grid items-center gap-6 rounded-[2rem] bg-[#08121a] p-6 text-white md:grid-cols-2 md:p-12">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7fd6ff]">{s.newsletterEyebrow}</p>
                <h2 id="newsletter-title" className="text-3xl text-white md:text-4xl">
                  {s.newsletterTitle}
                </h2>
                <p className="text-white/70">{s.newsletterBody}</p>
              </div>
              <div className="newsletter-dark">
                <NewsletterForm lang={lang} label={t.search.waitlistEmail} button={s.newsletterButton} city={citySlug} cityName={cityName} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
