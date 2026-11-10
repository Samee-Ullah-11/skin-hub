"use client";

import { useActionState } from "react";
import { submitClinicAction } from "@/actions/clinic";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import type { Lang } from "@/i18n/config";

export function SubmitForm({ lang, label, disabled }: { lang: Lang; label: string; disabled: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(submitClinicAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="lang" value={lang} />
      <FormMessage state={state} />
      {!state.ok ? (
        <div>
          <SubmitButton className={disabled ? "pointer-events-none opacity-50" : ""}>{label}</SubmitButton>
        </div>
      ) : null}
    </form>
  );
}
