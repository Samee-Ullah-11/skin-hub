import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { listNotifications, markAllRead, renderNotification } from "@/services/notifications";

export default async function NotificationsPage({ params }: PageProps<"/[lang]/dashboard/notifications">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const user = await requireUser("clinic_owner");
  const { items } = await listNotifications(user.id, 100);
  await markAllRead(user.id);
  return (
    <div>
      <PageTitle title={t.dashboard.notificationsTitle} />
      {items.length === 0 ? <p className="text-muted">{t.nav.noNotifications}</p> : null}
      <ul className="divide-y divide-line rounded-lg border border-line">
        {items.map((n) => (
          <li key={String(n._id)}>
            <a href={localePath(lang, n.link || "/dashboard")} className={`block px-4 py-3 hover:bg-soft ${n.readAt ? "text-muted" : "font-semibold"}`}>
              {renderNotification(lang, n.type, n.params as Record<string, string>)}
              <span className="block text-sm font-normal text-muted">{formatDateTime(n.createdAt, lang)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
