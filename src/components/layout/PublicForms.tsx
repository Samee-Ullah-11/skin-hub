"use client";

import { useActionState } from "react";
import { contactAction, newsletterAction, waitlistAction } from "@/actions/public";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import { TextAreaField, TextField } from "@/components/ui/FormFields";
import type { Dict } from "@/i18n";
import type { Lang } from "@/i18n/config";

export function ContactForm({ lang, t, optional }: { lang: Lang; t: Dict["home"]; optional: string }) {
  const [state, action] = useActionState<FormState, FormData>(contactAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <FormMessage state={state} />
      <TextField name="name" label={t.contactName} state={state} autoComplete="name" />
      <TextField name="email" label={t.contactEmail} state={state} type="email" autoComplete="email" dir="ltr" />
      <TextField name="phone" label={t.contactPhone} state={state} type="tel" autoComplete="tel" dir="ltr" optionalLabel={optional} />
      <TextAreaField name="message" label={t.contactMessage} state={state} rows={5} />
      <div className="flex justify-center">
        <SubmitButton className="w-full sm:w-auto sm:min-w-40">{t.getQuote}</SubmitButton>
      </div>
    </form>
  );
}

export function WaitlistForm({ lang, t, city, cityName }: { lang: Lang; t: Dict["search"]; city: string; cityName: string }) {
  const [state, action] = useActionState<FormState, FormData>(waitlistAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="cityName" value={cityName} />
      <div className="flex-1">
        <TextField name="email" label={t.waitlistEmail} state={state} type="email" autoComplete="email" dir="ltr" />
      </div>
      <SubmitButton>{t.waitlistJoin}</SubmitButton>
      {state.error ? <FormMessage state={state} /> : null}
    </form>
  );
}

/** "Hear when new clinics join": one email field and a button on one line. */
export function NewsletterForm({ lang, label, button, city, cityName }: { lang: Lang; label: string; button: string; city: string; cityName: string }) {
  const [state, action] = useActionState<FormState, FormData>(newsletterAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="flex w-full flex-col gap-3 sm:flex-row sm:items-start" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="cityName" value={cityName} />
      <div className="flex-1">
        <TextField name="email" label={label} state={state} type="email" autoComplete="email" dir="ltr" className="rounded-full" />
      </div>
      <SubmitButton className="rounded-full sm:mt-7">{button}</SubmitButton>
    </form>
  );
}
