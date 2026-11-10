import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { isLocalInbox, localInbox } from "@/services/email/provider";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Development only: every email the console provider "sent", with its main link as a button. */
export default async function DevInboxPage({ params }: PageProps<"/[lang]/dev/inbox">) {
  const { lang } = await params;
  if (!isLang(lang) || !isLocalInbox()) notFound();
  const t = getDict(lang).auth;
  const mails = localInbox();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <Icon name="monitor" size={16} />
          {t.localInboxTitle}
        </p>
        <h1 className="mt-1 text-3xl">{t.localInboxAll}</h1>
        <p className="mt-2 text-muted">{t.localInboxBody}</p>
      </div>
      {mails.length === 0 ? <p className="text-muted">{t.localInboxEmpty}</p> : null}
      <ul className="flex flex-col gap-3">
        {mails.map((m, i) => (
          <li key={i}>
            <Card className="flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{m.subject}</p>
                  <p className="text-sm text-muted" dir="ltr">
                    {m.to}
                    {m.at ? ` · ${formatDateTime(m.at, lang)}` : ""}
                  </p>
                </div>
                {m.ctaUrl ? (
                  <a href={m.ctaUrl} className={buttonClass("primary", "sm")}>
                    {t.localInboxOpenLink}
                  </a>
                ) : null}
              </div>
              <pre className="whitespace-pre-wrap rounded-xl bg-soft p-3 text-sm text-ink">{m.text}</pre>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
