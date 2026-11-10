"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/actions/auth";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import { TextField } from "@/components/ui/FormFields";
import type { Dict } from "@/i18n";
import type { Lang } from "@/i18n/config";

export function AccountProfileForm({
  lang,
  t,
  common,
  values,
}: {
  lang: Lang;
  t: Dict["auth"];
  common: Dict["common"];
  values: { name: string; phone: string; locale: Lang };
}) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <FormMessage state={state} />
      <TextField name="name" label={t.name} state={state} defaultValue={values.name} autoComplete="name" />
      <TextField name="phone" label={t.phone} hint={t.phoneHint} state={state} defaultValue={values.phone} type="tel" dir="ltr" />
      {/* Urdu is switched off, so emails are always English. */}
      <input type="hidden" name="locale" value="en" />
      <div>
        <SubmitButton>{common.save}</SubmitButton>
      </div>
    </form>
  );
}

export function ChangePasswordForm({ lang, t }: { lang: Lang; t: Dict["auth"] }) {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <FormMessage state={state} />
      <TextField name="current" label={t.currentPassword} state={state} type="password" autoComplete="current-password" />
      <TextField name="password" label={t.newPassword} hint={t.passwordHint} state={state} type="password" autoComplete="new-password" />
      <div>
        <SubmitButton variant="secondary">{t.changePassword}</SubmitButton>
      </div>
    </form>
  );
}
