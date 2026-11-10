import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";
import { ensureOwnClinic } from "@/services/clinics";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ClinicDashboardLayout({ children, params }: LayoutProps<"/[lang]/dashboard">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const user = await getSessionUser();
  if (!user || user.role !== "clinic_owner") redirect(localePath(lang, "/login?next=/dashboard"));
  await ensureOwnClinic(user.id, user.name);
  const t = getDict(lang).dashboard;
  const base = localePath(lang, "/dashboard");
  const links = [
    { href: base, label: t.navOverview, exact: true, icon: "home" as const },
    { href: `${base}/bookings`, label: t.navBookings, icon: "clock" as const },
    { href: `${base}/profile`, label: t.navProfile, icon: "pin" as const },
    { href: `${base}/doctors`, label: t.navDoctors, icon: "user" as const },
    { href: `${base}/deals`, label: getDict(lang).deals.navDeals, icon: "heart" as const },
    { href: `${base}/documents`, label: t.navDocuments, icon: "file" as const },
    { href: `${base}/notifications`, label: t.navNotifications, icon: "bell" as const },
    { href: `${base}/statements`, label: t.navStatements, icon: "star" as const },
    { href: `${base}/preview`, label: t.navPreview, icon: "globe" as const },
  ];
  return (
    <DashboardShell lang={lang} role="clinic" title={t.title} links={links}>
      {children}
    </DashboardShell>
  );
}
