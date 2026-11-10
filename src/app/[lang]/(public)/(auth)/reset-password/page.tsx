import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { AuthShell } from "../AuthShell";
import { ResetForm } from "../forms";

export const metadata: Metadata = { robots: { index: false } };

export default async function ResetPasswordPage({ params, searchParams }: PageProps<"/[lang]/reset-password">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang).auth;
  const token = (await searchParams).token;
  return (
    <AuthShell title={t.resetTitle}>
      <ResetForm lang={lang} t={t} token={typeof token === "string" ? token : ""} />
    </AuthShell>
  );
}
