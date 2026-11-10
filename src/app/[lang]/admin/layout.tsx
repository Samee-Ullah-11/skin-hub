import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children, params }: LayoutProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect(localePath(lang, "/login?next=/admin"));
  const t = getDict(lang).admin;
  const b = localePath(lang, "/admin");
  const links = [
    { href: b, label: t.navOverview, exact: true },
    { href: `${b}/pending`, label: t.navPending },
    { href: `${b}/clinics`, label: t.navClinics },
    { href: `${b}/users`, label: t.navUsers },
    { href: `${b}/locations`, label: t.navLocations },
    { href: `${b}/catalog`, label: t.navCatalog },
    { href: `${b}/featured`, label: t.navFeatured },
    { href: `${b}/statements`, label: t.navStatements },
    { href: `${b}/points`, label: t.navPoints },
    { href: `${b}/activity`, label: t.navActivity },
    { href: `${b}/settings`, label: t.navSettings },
    { href: `${b}/waitlist`, label: t.navWaitlist },
    { href: `${b}/emails`, label: t.navEmails },
    { href: `${b}/messages`, label: t.navMessages },
    { href: `${b}/testimonials`, label: t.navTestimonials },
  ];
  return (
    <DashboardShell lang={lang} role="admin" title={t.title} links={links}>
      {children}
    </DashboardShell>
  );
}
