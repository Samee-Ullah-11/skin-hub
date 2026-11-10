import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";
import { AuthShell } from "../AuthShell";
import { VerifyForm } from "../forms";

export const metadata: Metadata = { robots: { index: false } };

export default async function VerifyEmailPage({ params, searchParams }: PageProps<"/[lang]/verify-email">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang).auth;
  const token = (await searchParams).token;
  const user = await getSessionUser();
  const home = !user ? "/login" : user.role === "clinic_owner" ? "/dashboard" : user.role === "admin" ? "/admin" : "/";
  return (
    <AuthShell title={t.verifyTitle}>
      <VerifyForm lang={lang} t={t} token={typeof token === "string" ? token : ""} continueHref={localePath(lang, home)} />
    </AuthShell>
  );
}
