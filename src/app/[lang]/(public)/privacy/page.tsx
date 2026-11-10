import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPage, infoMeta } from "@/components/layout/InfoPage";
import { isLang } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? infoMeta(lang, "privacy") : {};
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <InfoPage lang={lang} page="privacy" />;
}
