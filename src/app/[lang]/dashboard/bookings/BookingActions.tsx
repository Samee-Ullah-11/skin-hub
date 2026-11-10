"use client";

import { useActionState, type ReactNode } from "react";
import { clinicBookingAction } from "@/actions/bookings";
import { Input } from "@/components/ui/Field";
import { FormMessage, SubmitButton, type FormState } from "@/components/ui/Form";
import type { Dict } from "@/i18n";
import type { Lang } from "@/i18n/config";

function OpForm({ lang, op, bookingId, children }: { lang: Lang; op: string; bookingId: string; children: ReactNode }) {
  const [state, action] = useActionState<FormState, FormData>(clinicBookingAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="bookingId" value={bookingId} />
      {children}
      {state.error ? <FormMessage state={state} /> : null}
    </form>
  );
}

export function BookingActions({
  lang,
  t,
  bookingId,
  status,
  started,
}: {
  lang: Lang;
  t: Dict["clinicBookings"];
  bookingId: string;
  status: string;
  started: boolean;
}) {
  if (status === "pending") {
    return (
      <div className="flex flex-wrap gap-2">
        <OpForm lang={lang} op="confirm" bookingId={bookingId}>
          <SubmitButton>{t.confirm}</SubmitButton>
        </OpForm>
        <OpForm lang={lang} op="decline" bookingId={bookingId}>
          <SubmitButton variant="secondary">{t.decline}</SubmitButton>
        </OpForm>
      </div>
    );
  }
  if (status === "confirmed" && started) {
    return (
      <div className="flex flex-col gap-2">
        <OpForm lang={lang} op="complete" bookingId={bookingId}>
          <Input name="fee" type="number" min={0} step={100} placeholder={t.visitFee} aria-label={t.visitFee} className="h-9 w-48" dir="ltr" />
          <SubmitButton>{t.complete}</SubmitButton>
        </OpForm>
        <OpForm lang={lang} op="no_show" bookingId={bookingId}>
          <SubmitButton variant="secondary">{t.noShow}</SubmitButton>
        </OpForm>
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <details>
        <summary className="cursor-pointer text-sm text-danger underline">{t.cancel}</summary>
        <OpForm lang={lang} op="cancel" bookingId={bookingId}>
          <Input name="reason" placeholder={t.cancelReason} aria-label={t.cancelReason} className="mt-2 h-9 w-56" required minLength={3} />
          <SubmitButton variant="danger">{t.cancel}</SubmitButton>
        </OpForm>
      </details>
    );
  }
  return null;
}
