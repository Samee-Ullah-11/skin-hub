import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClinicPreview } from "@/components/clinic/ClinicPreview";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { getClinicForAdmin } from "@/services/clinics";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminPreviewPage({ params }: PageProps<"/[lang]/admin/clinics/[id]/preview">) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const data = await getClinicForAdmin(id).catch((err) => {
    if (err instanceof AppError) notFound();
    throw err;
  });
  return <ClinicPreview lang={lang} t={getDict(lang)} clinic={data.clinic} />;
}
