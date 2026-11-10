import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { CLINIC_STATUSES, type ClinicStatus } from "@/models/Clinic";
import { listClinicsForAdmin } from "@/services/clinics";
import { ClinicTable } from "../ClinicTable";

export default async function AllClinicsPage({ params, searchParams }: PageProps<"/[lang]/admin/clinics">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const sp = await searchParams;
  const status = CLINIC_STATUSES.includes(sp.status as ClinicStatus) ? (sp.status as ClinicStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const clinics = await listClinicsForAdmin({ status, q, includeDeleted: sp.deleted === "1" });
  return (
    <div>
      <PageTitle title={t.admin.navClinics} />
      <form className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <label className="flex flex-col gap-1 text-sm">
          {t.admin.filterStatus}
          <Select name="status" defaultValue={status ?? ""} className="w-44">
            <option value="">{t.common.all}</option>
            {CLINIC_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.status[s]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.admin.search}
          <Input name="q" defaultValue={q} className="w-56" />
        </label>
        <Button type="submit" variant="secondary">
          {t.common.search}
        </Button>
      </form>
      <ClinicTable lang={lang} t={t} clinics={clinics} />
    </div>
  );
}
