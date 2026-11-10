import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@config/site";
import { PageTitle } from "@/components/layout/DashboardShell";
import { ResendForm } from "@/app/[lang]/(public)/(auth)/forms";
import { Banner } from "@/components/ui/Banner";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip, bookingTone } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { fmt, isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { listPatientBookings } from "@/services/bookings";
import { CancelForm } from "./CancelForm";

export default async function MyBookingsPage({ params }: PageProps<"/[lang]/account/bookings">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const a = t.account;
  const user = await requireUser("patient");
  const all = await listPatientBookings(user.id);
  const now = new Date();
  const upcoming = all.filter((b) => b.startUtc >= now && (b.status === "pending" || b.status === "confirmed")).reverse();
  const past = all.filter((b) => !upcoming.includes(b));

  const renderList = (items: typeof all) => (
    <ul className="flex flex-col gap-3">
      {items.map((b) => {
        const canCancel = (b.status === "pending" || b.status === "confirmed") && b.startUtc > now;
        const clinicName = b.clinic ? pick(b.clinic.name, lang) : "";
        return (
          <li key={String(b._id)}>
            <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold">{formatDateTime(b.startUtc, lang)}</p>
                <p>
                  {b.clinic ? (
                    <Link href={localePath(lang, `/clinic/${b.clinic.slug}`)} className="link">
                      {clinicName}
                    </Link>
                  ) : null}{" "}
                  · {fmt(a.with, { doctor: b.doctor ? pick(b.doctor.name, lang) : "" })}
                </p>
                {b.status === "pending" ? <p className="text-sm text-muted">{fmt(a.expiresAt, { time: formatDateTime(b.expiresAt, lang) })}</p> : null}
                {b.treatments.length ? <p className="text-sm font-semibold">{b.treatments.map((x) => pick(x, lang)).join(", ")}</p> : null}
                {b.note ? (
                  <p className="text-sm text-muted" dir="auto">
                    {b.note}
                  </p>
                ) : null}
                <div className="mt-1">
                  <StatusChip tone={bookingTone(b.status)} label={t.status[`booking_${b.status}`]} />
                </div>
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                {b.clinic?.whatsapp ? (
                  <a
                    href={waLink(b.clinic.whatsapp, fmt(t.clinicPage.whatsappText, { clinic: b.clinic.name.en, site: site.name }))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("secondary", "sm")}
                  >
                    <Icon name="chat" size={16} />
                    {a.whatsapp}
                  </a>
                ) : null}
                {canCancel ? <CancelForm lang={lang} bookingId={String(b._id)} label={a.cancel} confirmText={a.cancelConfirm} /> : null}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={a.bookingsTitle} />
      {!user.emailVerified ? (
        <Banner tone="pending" title={t.auth.unverifiedBanner}>
          <div className="mt-2 max-w-xs">
            <ResendForm lang={lang} t={t.auth} />
          </div>
        </Banner>
      ) : null}
      {all.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted">{a.noBookings}</p>
          <LinkButton href={localePath(lang, `/clinics/${site.defaultCitySlug}`)}>{a.findClinic}</LinkButton>
        </div>
      ) : null}
      {upcoming.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">{a.upcoming}</h2>
          {renderList(upcoming)}
        </section>
      ) : null}
      {past.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">{a.past}</h2>
          {renderList(past)}
        </section>
      ) : null}
    </div>
  );
}

