import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip, bookingTone } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { fmt, isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { listClinicBookings } from "@/services/bookings";
import { requireOwnClinic } from "@/services/clinics";
import { BookingActions } from "./BookingActions";

const TABS = ["pending", "upcoming", "past"] as const;

export default async function ClinicBookingsPage({ params, searchParams }: PageProps<"/[lang]/dashboard/bookings">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const b = t.clinicBookings;
  const user = await requireUser("clinic_owner");
  const clinic = await requireOwnClinic(user.id);
  const tabParam = (await searchParams).tab;
  const tab = TABS.includes(tabParam as (typeof TABS)[number]) ? (tabParam as (typeof TABS)[number]) : "pending";
  const rows = await listClinicBookings(
    user.id,
    tab === "pending" ? { status: "pending" } : tab === "upcoming" ? { status: "confirmed", scope: "upcoming" } : { scope: "past" },
  );
  const now = new Date();
  const tabLabel = { pending: b.tabPending, upcoming: b.tabUpcoming, past: b.tabPast };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t.dashboard.navBookings} intro={b.intro} />
      <nav className="flex gap-2" aria-label={t.dashboard.navBookings}>
        {TABS.map((k) => (
          <Link
            key={k}
            href={localePath(lang, `/dashboard/bookings?tab=${k}`)}
            aria-current={tab === k ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-[15px] font-medium ${tab === k ? "bg-chip text-chip-ink" : "hover:bg-soft"}`}
          >
            {tabLabel[k]}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? <p className="text-muted">{b.none}</p> : null}
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const when = formatDateTime(r.startUtc, lang);
          const patientName = r.patient?.name ?? "";
          return (
            <li key={String(r._id)}>
              <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold">{when}</p>
                  <p>
                    {b.patient}: <strong>{patientName}</strong>{" "}
                    {r.patient?.phone ? (
                      <a href={`tel:${r.patient.phone}`} className="link" dir="ltr">
                        {r.patient.phone}
                      </a>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted">{r.doctor ? pick(r.doctor.name, lang) : ""}</p>
                  {r.status === "pending" ? (
                    <p className="text-sm text-muted">{fmt(t.account.expiresAt, { time: formatDateTime(r.expiresAt, lang) })}</p>
                  ) : null}
                  {r.treatments.length ? <p className="text-sm font-semibold">{r.treatments.map((x) => pick(x, lang)).join(", ")}</p> : null}
                  {r.note ? (
                    <p className="rounded-md bg-soft px-3 py-2 text-sm" dir="auto">
                      {r.note}
                    </p>
                  ) : null}
                  <div>
                    <StatusChip tone={bookingTone(r.status)} label={t.status[`booking_${r.status}`]} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  {r.patient?.phone ? (
                    <a
                      href={waLink(r.patient.phone, fmt(b.whatsappText, { name: patientName, clinic: pick(clinic.name, lang), when }))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass("secondary", "sm")}
                    >
                      <Icon name="chat" size={16} />
                      {b.whatsappPatient}
                    </a>
                  ) : null}
                  <BookingActions lang={lang} t={b} bookingId={String(r._id)} status={r.status} started={r.startUtc <= now} />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
