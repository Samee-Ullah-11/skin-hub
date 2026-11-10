import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { StatusChip } from "@/components/ui/Chip";
import { fmt, isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatNumber } from "@/lib/format";
import { listOwnStatements } from "@/services/statements";

export default async function ClinicStatementsPage({ params }: PageProps<"/[lang]/dashboard/statements">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const user = await requireUser("clinic_owner");
  const rows = await listOwnStatements(user.id);
  const pkr = (n: number) => fmt(t.common.pkr, { amount: formatNumber(n, lang) });
  return (
    <div>
      <PageTitle title={t.clinicBookings.statementsTitle} intro={t.clinicBookings.statementsIntro} />
      {rows.length === 0 ? (
        <p className="text-muted">{t.clinicBookings.noStatements}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[560px] text-[15px]">
            <thead className="bg-soft text-sm text-muted">
              <tr>
                <th className="px-3 py-2 text-start">{t.admin.period}</th>
                <th className="px-3 py-2 text-start">{t.admin.bookings}</th>
                <th className="px-3 py-2 text-start">{t.admin.fees}</th>
                <th className="px-3 py-2 text-start">{t.admin.due}</th>
                <th className="px-3 py-2 text-start">{t.common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((s) => (
                <tr key={String(s._id)}>
                  <td className="px-3 py-3" dir="ltr">
                    {s.period}
                  </td>
                  <td className="px-3 py-3">{s.bookingCount}</td>
                  <td className="px-3 py-3">{pkr(s.totalFeesPkr)}</td>
                  <td className="px-3 py-3 font-semibold">{pkr(s.commissionDuePkr)}</td>
                  <td className="px-3 py-3">
                    <StatusChip tone={s.status === "paid" ? "approved" : "pending"} label={t.status[s.status]} />
                    {s.paidAt ? <span className="ms-2 text-sm text-muted">{formatDate(s.paidAt, lang)}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
