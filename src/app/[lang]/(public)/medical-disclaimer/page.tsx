import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPage, infoMeta } from "@/components/layout/InfoPage";
import { isLang } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[lang]/medical-disclaimer">): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? infoMeta(lang, "disclaimer") : {};
}

export default async function DisclaimerPage({ params }: PageProps<"/[lang]/medical-disclaimer">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <InfoPage lang={lang} page="disclaimer" />;
}
