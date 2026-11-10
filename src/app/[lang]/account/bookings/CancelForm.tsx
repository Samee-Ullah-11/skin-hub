"use client";

import { useActionState } from "react";
import { cancelMyBookingAction } from "@/actions/bookings";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import type { Lang } from "@/i18n/config";

export function CancelForm({ lang, bookingId, label, confirmText }: { lang: Lang; bookingId: string; label: string; confirmText: string }) {
  const [state, action] = useActionState<FormState, FormData>(cancelMyBookingAction, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <FormMessage state={state} />
      <SubmitButton variant="danger">{label}</SubmitButton>
    </form>
  );
}
