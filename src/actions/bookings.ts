"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bookingDefaults } from "@config/booking";
import { localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { parseForm, runAction, type ActionState } from "@/lib/action";
import { requireUser } from "@/lib/auth/session";
import { hitLimit, LIMITS } from "@/lib/rate-limit";
import * as bookings from "@/services/bookings";
import { objectId, optionalText, text } from "@/validation/common";

const createSchema = z.object({
  doctorId: objectId,
  startUtc: z.iso.datetime().transform((s) => new Date(s)),
  note: optionalText(bookingDefaults.noteMaxLength),
  treatmentIds: z.array(objectId).max(10).optional().default([]),
});

export async function createBookingAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser("patient");
    await hitLimit(LIMITS.booking, user.id);
    const input = parseForm(createSchema, form);
    await bookings.createBooking(user, input);
    revalidatePath(localePath(lang, "/account/bookings"));
    return { ok: true, message: getDict(lang).clinicPage.requestSent };
  });
}

export async function cancelMyBookingAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser("patient");
    const { bookingId } = parseForm(z.object({ bookingId: objectId }), form);
    await bookings.cancelByPatient(user.id, bookingId);
    revalidatePath(localePath(lang, "/account/bookings"));
    return { ok: true, message: getDict(lang).account.cancelled };
  });
}

const clinicOpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("confirm"), bookingId: objectId }),
  z.object({ op: z.literal("decline"), bookingId: objectId }),
  z.object({ op: z.literal("cancel"), bookingId: objectId, reason: text(300, 3) }),
  z.object({
    op: z.literal("complete"),
    bookingId: objectId,
    fee: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .pipe(z.number().int().min(0).max(10_000_000).optional()),
  }),
  z.object({ op: z.literal("no_show"), bookingId: objectId }),
]);

/** Clinic-side booking changes. Ownership is checked in the service against the caller's own clinic. */
export async function clinicBookingAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser("clinic_owner");
    const v = parseForm(clinicOpSchema, form);
    if (v.op === "confirm") await bookings.confirmBooking(user.id, v.bookingId);
    else if (v.op === "decline") await bookings.declineBooking(user.id, v.bookingId);
    else if (v.op === "cancel") await bookings.cancelByClinic(user.id, v.bookingId, v.reason);
    else if (v.op === "complete") await bookings.completeBooking(user.id, v.bookingId, v.fee);
    else await bookings.markNoShow(user.id, v.bookingId);
    revalidatePath(localePath(lang, "/dashboard/bookings"));
    return { ok: true, message: getDict(lang).clinicBookings.done };
  });
}
