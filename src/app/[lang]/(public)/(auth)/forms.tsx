"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  forgotPasswordAction,
  resendVerificationAction,
  resetPasswordAction,
  verifyEmailAction,
} from "@/actions/auth";
import { buttonClass } from "@/components/ui/Button";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import { TextField } from "@/components/ui/FormFields";
import type { Dict } from "@/i18n";
import { localePath, type Lang } from "@/i18n/config";

type Props = { lang: Lang; t: Dict["auth"] };

export function VerifyForm({ lang, t, token, continueHref }: Props & { token: string; continueHref: string }) {
  const [state, action] = useActionState<FormState, FormData>(verifyEmailAction, {});
  if (state.ok) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage state={state} />
        <Link href={continueHref} className={buttonClass("primary", "md", "w-full")}>
          {t.continue}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      {state.error ? (
        <Link href={localePath(lang, "/login")} className={buttonClass("secondary", "md", "w-full")}>
          {t.loginTitle}
        </Link>
      ) : (
        <SubmitButton className="w-full">{t.verifyTitle}</SubmitButton>
      )}
    </form>
  );
}

export function ResendForm({ lang, t }: Props) {
  const [state, action] = useActionState<FormState, FormData>(resendVerificationAction, {});
  const router = useRouter();
  // After a resend the page re-reads the local inbox, so in test mode the new link shows up at once.
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="lang" value={lang} />
      <FormMessage state={state} />
      {!state.ok ? (
        <SubmitButton variant="secondary" className="w-full">
          {t.resend}
        </SubmitButton>
      ) : null}
    </form>
  );
}

export function ForgotForm({ lang, t }: Props) {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <FormMessage state={state} />
      {!state.ok ? (
        <>
          <TextField name="email" label={t.email} state={state} type="email" autoComplete="email" dir="ltr" required />
          <SubmitButton className="w-full">{t.forgotButton}</SubmitButton>
        </>
      ) : null}
    </form>
  );
}

export function ResetForm({ lang, t, token }: Props & { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      {state.ok ? (
        <Link href={localePath(lang, "/login")} className={buttonClass("primary", "md", "w-full")}>
          {t.loginTitle}
        </Link>
      ) : (
        <>
          <TextField
            name="password"
            label={t.newPassword}
            hint={t.passwordHint}
            state={state}
            type="password"
            autoComplete="new-password"
            required
          />
          <SubmitButton className="w-full">{t.resetButton}</SubmitButton>
        </>
      )}
    </form>
  );
}
