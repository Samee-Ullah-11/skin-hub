import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { isLang, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { Treatment } from "@/models/Catalog";
import { requireOwnClinic } from "@/services/clinics";
import { listOwnDeals } from "@/services/deals";
import { zonedDateKey } from "@/services/schedule";
import { DealForm, EndDealButton } from "./DealForms";

export default async function ClinicDealsPage({ params }: PageProps<"/[lang]/dashboard/deals">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const d = t.deals;
  const user = await requireUser("clinic_owner");
  const clinic = await requireOwnClinic(user.id);
  const [deals, treatments] = await Promise.all([
    listOwnDeals(user.id),
    Treatment.find({ _id: { $in: clinic.treatments.map((x) => x.treatmentId) } }, { name: 1 }).lean(),
  ]);
  const names = new Map(treatments.map((tr) => [String(tr._id), pick(tr.name, lang)]));
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={d.dashTitle} intro={d.dashIntro} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="shadow-soft flex flex-col gap-4 rounded-2xl bg-surface p-5">
          <h2 className="text-xl">{d.newDeal}</h2>
          {treatments.length ? (
            <DealForm
              lang={lang}
              t={d}
              treatments={treatments.map((tr) => ({ id: String(tr._id), name: pick(tr.name, lang) }))}
              today={zonedDateKey(now)}
            />
          ) : (
            <p className="text-muted">{d.needTreatments}</p>
          )}
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">{d.yours}</h2>
          {deals.length ? (
            <ul className="flex flex-col gap-3">
              {deals.map((deal) => {
                const status = deal.endedAt || deal.endsAt <= now ? "ended" : deal.startsAt > now ? "scheduled" : "running";
                return (
                  <li key={String(deal._id)} className="shadow-soft flex items-center justify-between gap-4 rounded-2xl bg-surface p-4">
                    <div className="flex items-center gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-chip text-lg font-bold text-chip-ink">
                        -{deal.percentOff}%
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold">{names.get(String(deal.treatmentId)) ?? "—"}</span>
                        <span className="text-sm text-muted">
                          {formatDate(deal.startsAt, lang)} – {formatDate(deal.endsAt, lang)}
                          {deal.note ? ` · ${deal.note}` : ""}
                        </span>
                        <span
                          className={`mt-1 self-start rounded-full px-2 py-0.5 text-xs font-semibold ${
                            status === "running"
                              ? "bg-[var(--status-approved-bg)] text-[var(--status-approved-fg)]"
                              : status === "scheduled"
                                ? "bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)]"
                                : "bg-soft text-muted"
                          }`}
                        >
                          {status === "running" ? d.statusRunning : status === "scheduled" ? d.statusScheduled : d.statusEnded}
                        </span>
                      </div>
                    </div>
                    {status !== "ended" ? <EndDealButton lang={lang} dealId={String(deal._id)} label={d.end} /> : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-2xl bg-soft p-6 text-muted">{d.noneYours}</p>
          )}
        </section>
      </div>
    </div>
  );
}
