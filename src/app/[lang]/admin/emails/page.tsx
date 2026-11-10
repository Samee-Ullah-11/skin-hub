import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { failedEmails } from "@/services/admin";

export default async function EmailFailuresPage({ params }: PageProps<"/[lang]/admin/emails">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const rows = await failedEmails();
  return (
    <div>
      <PageTitle title={t.admin.navEmails} intro={t.admin.emailsIntro} />
      {rows.length === 0 ? <p className="text-muted">{t.admin.noFailures}</p> : null}
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {rows.map((r) => (
          <li key={String(r._id)} className="flex flex-col gap-1 px-4 py-3">
            <span className="flex flex-wrap gap-2 text-sm">
              <code>{r.template}</code>
              <span dir="ltr">{r.to}</span>
              <span className="text-muted">
                {r.provider} · {formatDateTime(r.createdAt, lang)}
              </span>
            </span>
            <span className="text-sm text-danger" dir="ltr">
              {r.error}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
