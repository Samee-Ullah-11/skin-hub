import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { homeFor } from "@/lib/auth/jwt";
import { getSessionUser } from "@/lib/auth/session";
import { isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { listCities } from "@/services/locations";
import { RoleAuthShell } from "../AuthShell";
import { ClinicSignupForm, SignupForm } from "./SignupForm";

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/signup">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang).auth;
  return { title: (await searchParams).as === "clinic" ? t.signupClinicTitle : t.signupTitle, robots: { index: false } };
}

export default async function SignupPage({ params, searchParams }: PageProps<"/[lang]/signup">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  // One session per browser: someone already signed in must log out before switching accounts.
  const me = await getSessionUser();
  if (me) redirect(localePath(lang, homeFor(me.role)));
  const t = getDict(lang).auth;
  const asClinic = (await searchParams).as === "clinic";

  if (asClinic) {
    const cities = (await listCities()).filter((c) => c.active).map((c) => ({ id: String(c._id), name: pick(c.name, lang) }));
    return (
      <RoleAuthShell lang={lang} t={t} side="clinic" mode="signup" title={t.signupClinicTitle} intro={t.signupClinicIntro}>
        <ClinicSignupForm lang={lang} t={t} cities={cities} />
      </RoleAuthShell>
    );
  }
  return (
    <RoleAuthShell lang={lang} t={t} side="patient" mode="signup" title={t.signupTitle} intro={t.signupIntro}>
      <SignupForm lang={lang} t={t} />
    </RoleAuthShell>
  );
}
