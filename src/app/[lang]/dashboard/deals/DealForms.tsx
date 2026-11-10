"use client";

import { useActionState } from "react";
import { createDealAction, endDealAction } from "@/actions/deals";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import { SelectField, TextField } from "@/components/ui/FormFields";
import type { Dict } from "@/i18n";
import type { Lang } from "@/i18n/config";

export function DealForm({
  lang,
  t,
  treatments,
  today,
}: {
  lang: Lang;
  t: Dict["deals"];
  treatments: { id: string; name: string }[];
  today: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(createDealAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lang" value={lang} />
      <FormMessage state={state} />
      <SelectField name="treatmentId" label={t.treatment} state={state} defaultValue="">
        <option value="" disabled>
          {t.chooseTreatment}
        </option>
        {treatments.map((tr) => (
          <option key={tr.id} value={tr.id}>
            {tr.name}
          </option>
        ))}
      </SelectField>
      <TextField name="percentOff" label={t.percentOff} hint={t.percentHint} state={state} type="number" min={5} max={80} inputMode="numeric" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="startsAt" label={t.startsAt} state={state} type="date" min={today} defaultValue={today} />
        <TextField name="endsAt" label={t.endsAt} hint={t.datesHint} state={state} type="date" min={today} />
      </div>
      <TextField name="note" label={t.note} hint={t.noteHint} state={state} maxLength={120} />
      <SubmitButton className="self-start rounded-full">{t.create}</SubmitButton>
    </form>
  );
}

export function EndDealButton({ lang, dealId, label }: { lang: Lang; dealId: string; label: string }) {
  const [state, action] = useActionState<FormState, FormData>(endDealAction, {});
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="dealId" value={dealId} />
      <SubmitButton variant="secondary" className="rounded-full">
        {label}
      </SubmitButton>
      {state.error ? <FormMessage state={state} /> : null}
    </form>
  );
}
