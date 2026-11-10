import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { RoleAuthShell } from "../AuthShell";
import { LoginForm } from "./LoginForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/login">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLang(lang) ? getDict(lang).auth.loginTitle : undefined, robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang).auth;
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  // Clinic side when asked for, or when the login leads on to the clinic dashboard.
  const side = sp.as === "clinic" || next?.startsWith("/dashboard") ? "clinic" : "patient";
  return (
    <RoleAuthShell
      lang={lang}
      t={t}
      side={side}
      mode="login"
      title={side === "clinic" ? t.loginClinicTitle : t.loginPatientTitle}
      intro={side === "clinic" ? t.loginClinicIntro : t.loginPatientIntro}
    >
      <LoginForm lang={lang} t={t} next={next} side={side} />
    </RoleAuthShell>
  );
}
