import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { adminOverview } from "@/services/admin";

export default async function AdminOverview({ params }: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang).admin;
  const s = await adminOverview();
  const tiles = [
    { label: t.statPending, value: s.pending, href: "/admin/pending" },
    { label: t.statApproved, value: s.approved, href: "/admin/clinics?status=approved" },
    { label: t.statPatients, value: s.patients, href: "/admin/users?role=patient" },
    { label: t.statLocationRequests, value: s.locationRequests, href: "/admin/locations" },
    { label: t.statUnpaid, value: s.unpaid, href: "/admin/statements" },
    { label: t.statFailedEmails, value: s.failedEmails, href: "/admin/emails" },
  ];
  return (
    <div>
      <PageTitle title={t.navOverview} />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link href={localePath(lang, tile.href)} className="block">
              <Card className="p-5 hover:border-primary">
                <p className="text-sm text-muted">{tile.label}</p>
                <p className="mt-1 text-3xl font-semibold">{tile.value}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
