import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { fmt, isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { listActivity } from "@/services/activity";

export default async function ActivityPage({ params, searchParams }: PageProps<"/[lang]/admin/activity">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { items, pages } = await listActivity(page);
  return (
    <div>
      <PageTitle title={t.admin.navActivity} intro={t.admin.activityIntro} />
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[640px] text-[15px]">
          <thead className="bg-soft text-sm text-muted">
            <tr>
              <th className="px-3 py-2 text-start">{t.admin.when}</th>
              <th className="px-3 py-2 text-start">{t.admin.actor}</th>
              <th className="px-3 py-2 text-start">{t.admin.action}</th>
              <th className="px-3 py-2 text-start">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((i) => {
              const actor = i.actorId as unknown as { name?: string; email?: string } | null;
              return (
                <tr key={String(i._id)}>
                  <td className="px-3 py-2 text-sm">{formatDateTime(i.createdAt, lang)}</td>
                  <td className="px-3 py-2 text-sm" dir="ltr">
                    {actor?.email}
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-sm">{i.action}</code>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted" dir="ltr">
                    {i.targetId ? String(i.targetId) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <nav className="mt-4 flex items-center gap-3 text-sm" aria-label={fmt(t.common.page, { page, pages })}>
        {page > 1 ? (
          <a className="link" href={localePath(lang, `/admin/activity?page=${page - 1}`)}>
            {t.common.previous}
          </a>
        ) : null}
        <span>{fmt(t.common.page, { page, pages })}</span>
        {page < pages ? (
          <a className="link" href={localePath(lang, `/admin/activity?page=${page + 1}`)}>
            {t.common.next}
          </a>
        ) : null}
      </nav>
    </div>
  );
}
