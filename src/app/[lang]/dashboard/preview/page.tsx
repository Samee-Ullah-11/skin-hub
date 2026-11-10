import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClinicPreview } from "@/components/clinic/ClinicPreview";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { requireOwnClinic } from "@/services/clinics";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerPreviewPage({ params }: PageProps<"/[lang]/dashboard/preview">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const user = await requireUser("clinic_owner");
  const clinic = await requireOwnClinic(user.id);
  return <ClinicPreview lang={lang} t={getDict(lang)} clinic={clinic} />;
}
