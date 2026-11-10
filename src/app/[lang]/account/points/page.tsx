import { notFound } from "next/navigation";
import { pointsRules } from "@config/points";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { fmt, isLang, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatNumber } from "@/lib/format";
import { pointsBalance, pointsHistory } from "@/services/points";

export default async function MyPointsPage({ params }: PageProps<"/[lang]/account/points">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const a = t.account;
  const user = await requireUser("patient");
  const [balance, history] = await Promise.all([pointsBalance(user.id), pointsHistory(user.id)]);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={a.pointsTitle} intro={a.pointsIntro} />
      <Card className="p-6">
        <p className="text-sm text-muted">{a.balance}</p>
        <p className="text-4xl font-semibold">{formatNumber(balance, lang)}</p>
        <p className="mt-2 text-sm text-muted">
          {fmt(a.pointsRules, { points: pointsRules.perCompletedVisit, max: pointsRules.maxEarningVisitsPerMonth })}
        </p>
      </Card>
      <section>
        <h2 className="mb-3 text-xl">{a.history}</h2>
        {history.length === 0 ? (
          <p className="text-muted">{a.noPoints}</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {history.map((e) => {
              const clinic = e.clinicId as unknown as { name?: { en: string; ur?: string } } | null;
              return (
                <li key={String(e._id)} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium">{a[`reason_${e.reason}`]}</p>
                    <p className="text-sm text-muted">
                      {formatDate(e.createdAt, lang)}
                      {clinic?.name ? ` · ${pick(clinic.name, lang)}` : ""}
                    </p>
                  </div>
                  <span className={`font-semibold ${e.delta < 0 ? "text-danger" : ""}`} dir="ltr">
                    {e.delta > 0 ? `+${e.delta}` : e.delta}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
