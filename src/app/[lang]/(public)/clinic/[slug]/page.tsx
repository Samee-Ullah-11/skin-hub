import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingWidget } from "@/components/clinic/BookingWidget";
import { bookingLabels, dayLabelMap, viewerKind } from "@/components/clinic/booking-props";
import { ClinicProfile } from "@/components/clinic/ClinicProfile";
import { isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { pageMeta } from "@/lib/seo";
import { getClinicDisplayData, getPublicClinicBySlug } from "@/services/clinics";
import { clinicHours } from "@/services/schedule";
import { getSettings } from "@/services/settings";
import { clinicDealMap } from "@/services/deals";

export async function generateMetadata({ params }: PageProps<"/[lang]/clinic/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const clinic = await getPublicClinicBySlug(slug);
  if (!clinic) return {};
  const display = await getClinicDisplayData(clinic);
  const name = pick(clinic.name, lang);
  const place = [pick(display.area?.name, lang), pick(display.city?.name, lang)].filter(Boolean).join(", ");
  const description = pick(clinic.description, lang).slice(0, 155);
  return pageMeta(lang, `/clinic/${clinic.slug}`, `${name}, ${place}`, description);
}

const DAY_CODES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default async function ClinicPage({ params, searchParams }: PageProps<"/[lang]/clinic/[slug]">) {
  const { lang, slug } = await params;
  const wanted = (await searchParams).treatment;
  if (!isLang(lang)) notFound();
  const clinic = await getPublicClinicBySlug(slug);
  if (!clinic) notFound();
  const t = getDict(lang);
  const [display, user, settings, deals] = await Promise.all([
    getClinicDisplayData(clinic),
    getSessionUser(),
    getSettings(),
    clinicDealMap(clinic._id),
  ]);
  const coords = clinic.location?.coordinates;
  const preselected = typeof wanted === "string" ? display.treatments.find((tr) => String(tr._id) === wanted || tr.slug === wanted) : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: clinic.name.en,
    url: `${env().APP_URL}${localePath("en", `/clinic/${clinic.slug}`)}`,
    telephone: clinic.phone || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.address?.en,
      addressLocality: display.city?.name.en,
      addressCountry: "PK",
    },
    geo: coords?.length === 2 ? { "@type": "GeoCoordinates", latitude: coords[1], longitude: coords[0] } : undefined,
    openingHours: clinicHours(display.doctors).map((h) => `${DAY_CODES[h.weekday]} ${h.start}-${h.end}`),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ClinicProfile
        lang={lang}
        t={t}
        clinic={clinic}
        display={display}
        deals={deals}
        booking={
          <BookingWidget
            lang={lang}
            doctors={display.doctors.map((d) => ({ id: String(d._id), name: pick(d.name, lang), specialty: pick(d.specialty, lang) }))}
            labels={bookingLabels(t)}
            viewer={viewerKind(user)}
            returnPath={`/clinic/${clinic.slug}`}
            dayLabels={dayLabelMap(lang, settings.bookingWindowDays)}
            treatments={display.treatments.map((tr) => ({ id: String(tr._id), name: pick(tr.name, lang) }))}
            initialTreatmentId={preselected ? String(preselected._id) : ""}
          />
        }
      />
    </>
  );
}
