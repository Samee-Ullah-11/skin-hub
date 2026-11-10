import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Form";
import { fmt, isLang, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatNumber } from "@/lib/format";
import { previousPeriod } from "@/services/commission";
import { listStatements, unpaidByClinic } from "@/services/statements";

export default async function AdminStatementsPage({ params }: PageProps<"/[lang]/admin/statements">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const a = t.admin;
  const [statements, unpaid] = await Promise.all([listStatements(), unpaidByClinic()]);
  const lastMonth = previousPeriod();
  const pkr = (n: number) => fmt(t.common.pkr, { amount: formatNumber(n, lang) });

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={a.navStatements} intro={a.statementsIntro} />
      <Card className="p-5">
        <AdminForm op="statements.generate" lang={lang} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {a.period}
            <Input type="month" name="period" defaultValue={lastMonth} required className="w-48" dir="ltr" />
          </label>
          <SubmitButton>{a.generate}</SubmitButton>
        </AdminForm>
      </Card>

      {unpaid.length ? (
        <Card className="p-5">
          <h2 className="mb-2 text-lg">{a.unpaidClinics}</h2>
          <ul className="flex flex-col gap-1">
            {unpaid.map((u) => (
              <li key={String(u._id)}>
                {u.name ? pick(u.name, lang) : String(u._id)}: <strong>{pkr(u.due)}</strong> ({u.count})
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[760px] text-[15px]">
          <thead className="bg-soft text-sm text-muted">
            <tr>
              <th className="px-3 py-2 text-start">{a.period}</th>
              <th className="px-3 py-2 text-start">{t.common.name}</th>
              <th className="px-3 py-2 text-start">{a.bookings}</th>
              <th className="px-3 py-2 text-start">{a.fees}</th>
              <th className="px-3 py-2 text-start">{a.due}</th>
              <th className="px-3 py-2 text-start">{t.common.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {statements.map((s) => {
              const clinic = s.clinicId as unknown as { name?: { en: string; ur?: string } } | null;
              return (
                <tr key={String(s._id)}>
                  <td className="px-3 py-3" dir="ltr">
                    {s.period}
                  </td>
                  <td className="px-3 py-3">{clinic?.name ? pick(clinic.name, lang) : "—"}</td>
                  <td className="px-3 py-3">{s.bookingCount}</td>
                  <td className="px-3 py-3">{pkr(s.totalFeesPkr)}</td>
                  <td className="px-3 py-3 font-semibold">{pkr(s.commissionDuePkr)}</td>
                  <td className="px-3 py-3">
                    {s.status === "paid" ? (
                      <div>
                        <StatusChip tone="approved" label={t.status.paid} />
                        <p className="mt-1 text-sm text-muted">
                          {fmt(a.paidOn, { date: s.paidAt ? formatDate(s.paidAt, lang) : "" })} · {s.paymentRef}
                        </p>
                      </div>
                    ) : (
                      <AdminForm op="statement.paid" lang={lang} hidden={{ id: String(s._id) }} className="flex flex-wrap items-center gap-2">
                        <StatusChip tone="pending" label={t.status.unpaid} />
                        <Input name="ref" placeholder={a.paymentRef} required className="h-9 w-40" />
                        <SubmitButton variant="secondary">{a.markPaid}</SubmitButton>
                      </AdminForm>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
