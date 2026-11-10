import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Form";
import { fmt, isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { suspiciousPatterns } from "@/services/points";

export default async function AdminPointsPage({ params }: PageProps<"/[lang]/admin/points">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const a = t.admin;
  const rows = await suspiciousPatterns();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={a.navPoints} intro={a.pointsIntro} />
      <Card className="p-5">
        <h2 className="mb-3 text-lg">{a.revoke}</h2>
        <AdminForm op="points.revoke" lang={lang} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {a.patientEmail}
            <Input name="email" type="email" required className="w-64" dir="ltr" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {a.amount}
            <Input name="amount" type="number" min={1} required className="w-28" dir="ltr" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {t.common.reason}
            <Input name="note" required className="w-64" />
          </label>
          <SubmitButton variant="danger">{a.revoke}</SubmitButton>
        </AdminForm>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 text-lg">{a.suspicious}</h2>
        {rows.length === 0 ? <p className="text-muted">{a.noSuspicious}</p> : null}
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((r) => (
            <li key={r.key} className="py-2">
              <span dir="ltr">{r.email}</span> · {r.clinic} ·{" "}
              <strong>{fmt(a.visits, { count: r.count })}</strong>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
