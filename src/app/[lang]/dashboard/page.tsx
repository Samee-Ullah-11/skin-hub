import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Banner } from "@/components/ui/Banner";
import { LinkButton } from "@/components/ui/Button";
import { StatusChip, bookingTone } from "@/components/ui/Chip";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tile } from "@/components/ui/Tile";
import { Doctor } from "@/models/Doctor";
import { fmt, isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatDateKey, formatTime } from "@/lib/format";
import { clinicStats, listClinicBookings } from "@/services/bookings";
import { clinicReadiness, requireOwnClinic } from "@/services/clinics";
import { listNotifications } from "@/services/notifications";
import { zonedDateKey } from "@/services/schedule";
import { BookingActions } from "./bookings/BookingActions";
import { SubmitForm } from "./SubmitForm";

const SHOW = 5;

export default async function DashboardOverview({ params }: PageProps<"/[lang]/dashboard">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const d = t.dashboard;
  const b = t.clinicBookings;
  const user = await requireUser("clinic_owner");
  const clinic = await requireOwnClinic(user.id);
  const live = clinic.status === "approved";
  const now = new Date();
  const [readiness, stats, doctorCount, notes, pending, upcoming] = await Promise.all([
    clinicReadiness(clinic),
    clinicStats(clinic._id, now),
    Doctor.countDocuments({ clinicId: clinic._id, active: true }),
    listNotifications(user.id, 1),
    live ? listClinicBookings(user.id, { status: "pending" }, now) : Promise.resolve([]),
    live ? listClinicBookings(user.id, { status: "confirmed", scope: "upcoming" }, now) : Promise.resolve([]),
  ]);
  const unread = notes.unread;
  const href = (p: string) => localePath(lang, p);

  // Confirmed visits per day for the coming week, for the small calendar strip.
  const todayKey = zonedDateKey(now);
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = zonedDateKey(new Date(now.getTime() + i * 86400_000));
    return { key, count: upcoming.filter((x) => x.startUtc >= now && zonedDateKey(x.startUtc) === key).length };
  });
  const weekMax = Math.max(1, ...week.map((w) => w.count));
  const nextVisits = upcoming.filter((x) => x.startUtc >= now).slice(0, SHOW);

  const banner = {
    draft: <Banner tone="blocked" title={t.status.draft}>{d.statusDraft}</Banner>,
    pending: <Banner tone="pending" title={t.status.pending}>{d.statusPending}</Banner>,
    approved: null,
    rejected: (
      <Banner tone="rejected" title={t.status.rejected}>
        <p>{d.statusRejected}</p>
        {clinic.rejectionReason ? (
          <p className="mt-1">
            <strong>{t.common.reason}:</strong> {clinic.rejectionReason}
          </p>
        ) : null}
      </Banner>
    ),
    blocked: (
      <Banner tone="blocked" title={t.status.blocked}>
        <p>{d.statusBlocked}</p>
        {clinic.blockReason ? (
          <p className="mt-1">
            <strong>{t.common.reason}:</strong> {clinic.blockReason}
          </p>
        ) : null}
      </Banner>
    ),
  }[clinic.status];

  const steps = [
    { label: d.stepProfile, done: readiness.profile, href: "/dashboard/profile" },
    { label: d.stepLocation, done: readiness.location, href: "/dashboard/profile#map" },
    { label: d.stepTreatments, done: readiness.treatments, href: "/dashboard/profile#treatments" },
    { label: d.stepDoctors, done: readiness.doctors, href: "/dashboard/doctors" },
    ...readiness.documents.map((doc) => ({
      label: fmt(d.stepDocument, { label: pick(doc.label, lang) }),
      done: doc.done,
      href: "/dashboard/documents",
    })),
  ];
  const canSubmit = clinic.status === "draft" || clinic.status === "rejected";
  const showSetup = canSubmit || clinic.status === "pending";
  const stepsDone = steps.filter((s) => s.done).length;
  const docsDone = readiness.documents.filter((x) => x.done).length;
  const profileDone = readiness.profile && readiness.location && readiness.treatments;

  const manage: { href: string; icon: IconName; label: string; hint: string; attention?: boolean }[] = [
    { href: "/dashboard/profile", icon: "pin", label: d.navProfile, hint: profileDone ? d.hintComplete : d.hintNeedsDetails, attention: !profileDone },
    { href: "/dashboard/doctors", icon: "user", label: d.navDoctors, hint: String(doctorCount), attention: !doctorCount },
    { href: "/dashboard/deals", icon: "heart", label: t.deals.navDeals, hint: "" },
    { href: "/dashboard/documents", icon: "file", label: d.navDocuments, hint: fmt(d.hintDocs, { done: docsDone, total: readiness.documents.length }), attention: docsDone < readiness.documents.length },
    { href: "/dashboard/statements", icon: "star", label: d.navStatements, hint: d.hintStatements },
    { href: "/dashboard/preview", icon: "globe", label: d.navPreview, hint: d.hintOpen },
  ];

  const setup = showSetup ? (
    <section className="shadow-soft flex flex-col gap-4 rounded-3xl bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl">{d.stepsTitle}</h2>
        <p className="text-sm text-muted">{fmt(d.stepsProgress, { done: stepsDone, total: steps.length })}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-soft" aria-hidden="true">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${(stepsDone / steps.length) * 100}%` }} />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.label}>
            <a
              href={href(s.href)}
              className={`flex h-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${s.done ? "bg-soft text-muted" : "bg-chip text-chip-ink hover:brightness-95"}`}
            >
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: s.done ? "var(--status-approved-bg)" : "var(--surface)",
                  color: s.done ? "var(--status-approved-fg)" : "var(--muted)",
                }}
              >
                {s.done ? <Icon name="check" size={14} /> : null}
              </span>
              <span className={s.done ? "line-through decoration-1" : "font-medium"}>{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
      {canSubmit ? <SubmitForm lang={lang} label={clinic.status === "rejected" ? d.resubmit : d.submit} disabled={!readiness.ready} /> : null}
    </section>
  ) : null;

  const requests = (
    <section className="shadow-soft flex flex-col gap-4 rounded-3xl bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl">
          <Icon name="clock" size={20} className="text-primary" />
          {d.requestsTitle}
          {stats.pending ? (
            <span className="rounded-full bg-[var(--status-pending-bg)] px-2.5 py-0.5 text-sm font-semibold text-[var(--status-pending-fg)]">{stats.pending}</span>
          ) : null}
        </h2>
        <Link href={href("/dashboard/bookings?tab=pending")} className="link text-sm">
          {d.seeAllBookings}
        </Link>
      </div>
      {!live ? (
        <p className="rounded-2xl bg-soft p-4 text-sm text-muted">{d.bookingsClosed}</p>
      ) : pending.length === 0 ? (
        <p className="rounded-2xl bg-soft p-4 text-sm text-muted">{d.requestsEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.slice(0, SHOW).map((r) => (
            <li key={String(r._id)} className="flex flex-col gap-3 rounded-2xl border border-line p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-chip text-chip-ink">
                  <span className="text-lg font-semibold leading-none">{formatDate(r.startUtc, lang, { day: "numeric" })}</span>
                  <span className="text-xs">{formatDate(r.startUtc, lang, { month: "short" })}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">
                    {formatTime(r.startUtc, lang)} · {r.patient?.name ?? ""}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {r.treatments.length ? r.treatments.map((x) => pick(x, lang)).join(", ") : ""}
                    {r.doctor ? ` · ${pick(r.doctor.name, lang)}` : ""}
                  </p>
                  {r.patient?.phone ? (
                    <a href={`tel:${r.patient.phone}`} className="link text-sm" dir="ltr">
                      {r.patient.phone}
                    </a>
                  ) : null}
                </div>
              </div>
              <BookingActions lang={lang} t={b} bookingId={String(r._id)} status={r.status} started={r.startUtc <= now} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const visits = (
    <section className="shadow-soft flex flex-col gap-4 rounded-3xl bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl">
          <Icon name="check" size={20} className="text-primary" />
          {d.nextVisitsTitle}
        </h2>
        <Link href={href("/dashboard/bookings?tab=upcoming")} className="link text-sm">
          {d.seeAllBookings}
        </Link>
      </div>
      {/* Seven-day strip: one bar per day, taller for busier days. */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{d.weekTitle}</p>
        <ol className="grid grid-cols-7 gap-1.5">
          {week.map((w) => (
            <li key={w.key} className={`flex flex-col items-center gap-1 rounded-xl p-2 ${w.key === todayKey ? "bg-chip text-chip-ink" : "bg-soft"}`}>
              <span className="text-[11px] uppercase text-muted">{formatDateKey(w.key, lang, { weekday: "short" })}</span>
              <span className="text-sm font-semibold">{formatDateKey(w.key, lang, { day: "numeric" })}</span>
              <span className="flex h-8 w-full items-end" aria-hidden="true">
                <span className="w-full rounded-sm bg-primary" style={{ height: `${w.count ? Math.max(20, (w.count / weekMax) * 100) : 0}%` }} />
              </span>
              <span className="sr-only">{fmt(d.weekVisits, { count: w.count })}</span>
              <span className="text-xs text-muted" aria-hidden="true">
                {w.count || ""}
              </span>
            </li>
          ))}
        </ol>
      </div>
      {!live ? null : nextVisits.length === 0 ? (
        <p className="text-sm text-muted">{d.nextVisitsEmpty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {nextVisits.map((r) => (
            <li key={String(r._id)} className="flex items-center gap-3 py-3">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-soft">
                <span className="text-base font-semibold leading-none">{formatDate(r.startUtc, lang, { day: "numeric" })}</span>
                <span className="text-[11px] text-muted">{formatDate(r.startUtc, lang, { month: "short" })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {formatTime(r.startUtc, lang)} · {r.patient?.name ?? ""}
                </p>
                <p className="truncate text-sm text-muted">
                  {r.treatments.length ? r.treatments.map((x) => pick(x, lang)).join(", ") : ""}
                  {r.doctor ? ` · ${pick(r.doctor.name, lang)}` : ""}
                </p>
              </div>
              <StatusChip tone={bookingTone(r.status)} label={t.status[`booking_${r.status}`]} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={pick(clinic.name, lang)}
        intro={live ? d.statusApproved : undefined}
        actions={
          <>
            <LinkButton href={href("/dashboard/bookings")} variant="primary" className="rounded-full">
              {d.navBookings}
            </LinkButton>
            {live ? (
              <LinkButton href={href(`/clinic/${clinic.slug}`)} variant="secondary" className="rounded-full">
                {d.viewPublic}
              </LinkButton>
            ) : null}
          </>
        }
      />
      {banner}

      {/* The numbers that matter today. */}
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <li>
          <Tile href={href("/dashboard/bookings?tab=pending")} icon="clock" title={d.pendingRequests} value={stats.pending} hint={d.hintReply} tone={stats.pending ? "attention" : "default"} />
        </li>
        <li>
          <Tile href={href("/dashboard/bookings?tab=upcoming")} icon="check" title={d.upcomingConfirmed} value={stats.upcoming} hint={d.hintUpcoming} />
        </li>
        <li>
          <Tile href={href("/dashboard/doctors")} icon="user" title={d.doctorsCount} value={doctorCount} tone={doctorCount ? "default" : "attention"} />
        </li>
        <li>
          <Tile href={href("/dashboard/notifications")} icon="bell" title={d.navNotifications} value={unread} hint={fmt(d.hintUnread, { count: unread })} />
        </li>
      </ul>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {live ? (
            <>
              {requests}
              {visits}
            </>
          ) : (
            <>
              {setup}
              {requests}
            </>
          )}
        </div>
        <aside className="flex flex-col gap-6">
          {live ? null : visits}
          <section className="shadow-soft rounded-3xl bg-surface p-3">
            <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted">{d.manageTitle}</p>
            <ul className="flex flex-col">
              {manage.map((m) => (
                <li key={m.href}>
                  <Link href={href(m.href)} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-soft">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.attention ? "bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)]" : "bg-soft text-muted"}`}>
                      <Icon name={m.icon} size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium">{m.label}</span>
                      {m.hint ? <span className="block truncate text-xs text-muted">{m.hint}</span> : null}
                    </span>
                    <Icon name="chevronRight" size={16} className="text-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
