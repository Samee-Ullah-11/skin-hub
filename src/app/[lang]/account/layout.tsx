import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children, params }: LayoutProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const user = await getSessionUser();
  if (!user || user.role !== "patient") redirect(localePath(lang, "/login?next=/account/bookings"));
  const t = getDict(lang);
  // No side menu for patients: the navbar (desktop), bottom bar (phones) and the profile page's boxes cover it.
  return (
    <DashboardShell lang={lang} role="public" title={t.nav.account} links={[]}>
      {children}
    </DashboardShell>
  );
}
