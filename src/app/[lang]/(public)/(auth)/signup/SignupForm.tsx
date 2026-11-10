"use client";

import Link from "next/link";
import { useActionState } from "react";
import { clinicSignupAction, signupAction } from "@/actions/auth";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import { SelectField, TextField } from "@/components/ui/FormFields";
import type { Dict } from "@/i18n";
import { localePath, type Lang } from "@/i18n/config";

type Props = { lang: Lang; t: Dict["auth"] };

function AgreeField({ lang, t, state }: Props & { state: FormState }) {
  const [before, after] = t.agree.split("{terms}");
  const [mid, end] = after.split("{privacy}");
  return (
    <div className="flex flex-col gap-1">
      <label className="inline-flex items-start gap-2 text-[15px]">
        <input type="checkbox" name="agree" className="mt-1.5 h-4 w-4 accent-[var(--primary)]" required />
        <span>
          {before}
          <Link href={localePath(lang, "/terms")} className="link" target="_blank">
            {t.termsLink}
          </Link>
          {mid}
          <Link href={localePath(lang, "/privacy")} className="link" target="_blank">
            {t.privacyLink}
          </Link>
          {end}
        </span>
      </label>
      {state.fieldErrors?.agree ? (
        <p className="text-sm font-medium text-danger" role="alert">
          {state.fieldErrors.agree}
        </p>
      ) : null}
    </div>
  );
}

/** Patient sign up: personal details only. */
export function SignupForm({ lang, t }: Props) {
  const [state, action] = useActionState<FormState, FormData>(signupAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="role" value="patient" />
      <FormMessage state={state} />
      <TextField name="name" label={t.name} state={state} autoComplete="name" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="email" label={t.email} state={state} type="email" autoComplete="email" dir="ltr" required />
        <TextField name="phone" label={t.phone} hint={t.phoneHint} state={state} type="tel" autoComplete="tel" dir="ltr" required />
      </div>
      <TextField name="password" label={t.password} hint={t.passwordHint} state={state} type="password" autoComplete="new-password" required />
      <AgreeField lang={lang} t={t} state={state} />
      <SubmitButton className="w-full rounded-full">{t.createAccount}</SubmitButton>
      <p className="text-center text-[15px] text-muted">
        {t.haveAccount}{" "}
        <Link href={localePath(lang, "/login")} className="link">
          {t.loginTitle}
        </Link>
      </p>
    </form>
  );
}

/** Clinic registration: clinic name and city plus the owner's details. Creates a draft clinic. */
export function ClinicSignupForm({ lang, t, cities }: Props & { cities: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(clinicSignupAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="clinicName" label={t.clinicName} state={state} autoComplete="organization" required />
        <SelectField name="cityId" label={t.clinicCity} state={state} required defaultValue="">
          <option value="" disabled>
            {t.chooseCity}
          </option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField name="name" label={t.ownerName} state={state} autoComplete="name" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="email" label={t.email} state={state} type="email" autoComplete="email" dir="ltr" required />
        <TextField name="phone" label={t.clinicPhone} hint={t.phoneHint} state={state} type="tel" autoComplete="tel" dir="ltr" required />
      </div>
      <TextField name="password" label={t.password} hint={t.passwordHint} state={state} type="password" autoComplete="new-password" required />
      <AgreeField lang={lang} t={t} state={state} />
      <SubmitButton className="w-full rounded-full">{t.registerClinicButton}</SubmitButton>
      <p className="text-center text-[15px] text-muted">
        {t.haveAccount}{" "}
        <Link href={localePath(lang, "/login?as=clinic")} className="link">
          {t.loginTitle}
        </Link>
      </p>
    </form>
  );
}
