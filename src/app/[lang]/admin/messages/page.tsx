import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SubmitButton } from "@/components/ui/Form";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { listContactMessages } from "@/services/admin";

export default async function MessagesPage({ params }: PageProps<"/[lang]/admin/messages">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const rows = await listContactMessages();
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={t.admin.navMessages} intro={t.admin.messagesIntro} />
      {rows.length === 0 ? <p className="text-muted">{t.common.noResults}</p> : null}
      {rows.map((m) => (
        <Card key={String(m._id)} className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">
              {m.name} · <span dir="ltr">{m.email}</span> {m.phone ? <span dir="ltr">· {m.phone}</span> : null}
            </p>
            <span className="text-sm text-muted">{formatDateTime(m.createdAt, lang)}</span>
          </div>
          <p className="whitespace-pre-line" dir="auto">
            {m.message}
          </p>
          {m.handledAt ? (
            <Chip className="self-start">{t.admin.handled}</Chip>
          ) : (
            <AdminForm op="message.handled" lang={lang} hidden={{ id: String(m._id) }}>
              <SubmitButton variant="secondary">{t.admin.markHandled}</SubmitButton>
            </AdminForm>
          )}
        </Card>
      ))}
    </div>
  );
}
