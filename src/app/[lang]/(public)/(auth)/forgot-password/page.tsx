import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { AuthShell } from "../AuthShell";
import { ForgotForm } from "../forms";

export const metadata: Metadata = { robots: { index: false } };

export default async function ForgotPasswordPage({ params }: PageProps<"/[lang]/forgot-password">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang).auth;
  return (
    <AuthShell title={t.forgotTitle} intro={t.forgotIntro}>
      <ForgotForm lang={lang} t={t} />
    </AuthShell>
  );
}
