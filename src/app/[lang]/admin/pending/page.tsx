import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { listClinicsForAdmin } from "@/services/clinics";
import { ClinicTable } from "../ClinicTable";

export default async function PendingClinicsPage({ params }: PageProps<"/[lang]/admin/pending">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const clinics = await listClinicsForAdmin({ status: "pending" });
  return (
    <div>
      <PageTitle title={t.admin.navPending} />
      {clinics.length ? <ClinicTable lang={lang} t={t} clinics={clinics} /> : <p className="text-muted">{t.admin.noPending}</p>}
    </div>
  );
}
