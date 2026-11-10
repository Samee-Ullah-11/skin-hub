import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPage, infoMeta } from "@/components/layout/InfoPage";
import { isLang } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? infoMeta(lang, "about") : {};
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <InfoPage lang={lang} page="about" />;
}
