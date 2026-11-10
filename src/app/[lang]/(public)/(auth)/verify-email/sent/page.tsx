import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fmt, isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { isLocalInbox, localInbox } from "@/services/email/provider";
import { AuthShell } from "../../AuthShell";
import { ResendForm } from "../../forms";

export const metadata: Metadata = { robots: { index: false } };

export default async function VerifySentPage({ params }: PageProps<"/[lang]/verify-email/sent">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang).auth;
  const user = await getSessionUser();
  const next = user?.role === "clinic_owner" ? "/dashboard" : "/";
  // While developing, emails stay on this computer: show the link right here so testing never stalls.
  const local = isLocalInbox() && user && !user.emailVerified;
  const latest = local ? localInbox(user.email).find((m) => m.ctaUrl) : undefined;
  return (
    <AuthShell title={t.checkInboxTitle} intro={fmt(t.checkInboxBody, { email: user?.email ?? "" })}>
      <div className="flex flex-col gap-3">
        {local ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-chip p-4 text-chip-ink">
            <p className="flex items-center gap-2 font-semibold">
              <Icon name="monitor" size={18} />
              {t.localInboxTitle}
            </p>
            <p className="text-sm">{t.localInboxBody}</p>
            {latest?.ctaUrl ? (
              <a href={latest.ctaUrl} className={buttonClass("primary", "md", "w-full")}>
                {t.localInboxOpen}
              </a>
            ) : (
              <p className="text-sm">{t.localInboxWaiting}</p>
            )}
            <Link href={localePath(lang, "/dev/inbox")} className="link self-start text-sm">
              {t.localInboxAll}
            </Link>
          </div>
        ) : null}
        {user && !user.emailVerified ? <ResendForm lang={lang} t={t} /> : null}
        <Link href={localePath(lang, next)} className={buttonClass(local ? "secondary" : "primary", "md", "w-full")}>
          {t.continue}
        </Link>
      </div>
    </AuthShell>
  );
}
