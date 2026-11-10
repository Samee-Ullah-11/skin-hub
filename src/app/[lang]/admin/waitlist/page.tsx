import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { isLang, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { listWaitlist } from "@/services/admin";

export default async function WaitlistPage({ params }: PageProps<"/[lang]/admin/waitlist">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const rows = await listWaitlist();
  return (
    <div>
      <PageTitle title={t.admin.navWaitlist} intro={t.admin.waitlistIntro} />
      {rows.length === 0 ? <p className="text-muted">{t.common.noResults}</p> : null}
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {rows.map((r) => {
          const city = r.cityId as unknown as { name?: { en: string; ur?: string } } | null;
          return (
            <li key={String(r._id)} className="flex flex-wrap justify-between gap-2 px-4 py-2">
              <span dir="ltr">{r.email}</span>
              <span className="text-sm text-muted">
                {pick(city?.name, lang)} · {formatDate(r.createdAt, lang)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
