"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import { TextField } from "@/components/ui/FormFields";
import type { Dict } from "@/i18n";
import { localePath, type Lang } from "@/i18n/config";

export function LoginForm({ lang, t, next, side }: { lang: Lang; t: Dict["auth"]; next?: string; side: "patient" | "clinic" }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage state={state} />
      <TextField name="email" label={t.email} state={state} type="email" autoComplete="email" dir="ltr" required />
      <TextField name="password" label={t.password} state={state} type="password" autoComplete="current-password" required />
      <Link href={localePath(lang, "/forgot-password")} className="link self-start text-[15px]">
        {t.forgotLink}
      </Link>
      <SubmitButton className="w-full rounded-full">{t.loginButton}</SubmitButton>
      <p className="text-center text-[15px] text-muted">
        {t.noAccount}{" "}
        <Link href={localePath(lang, side === "clinic" ? "/signup?as=clinic" : "/signup")} className="link">
          {side === "clinic" ? t.clinicSignupLink : t.patientSignupLink}
        </Link>
      </p>
    </form>
  );
}
