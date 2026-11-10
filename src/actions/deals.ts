"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { parseForm, runAction, type ActionState } from "@/lib/action";
import { requireUser } from "@/lib/auth/session";
import { createOwnDeal, endOwnDeal } from "@/services/deals";
import { objectId, optionalText } from "@/validation/common";

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "required" });

const dealSchema = z.object({
  treatmentId: objectId,
  percentOff: z.coerce.number({ error: "required" }).int({ error: "outOfRange" }).min(5, { error: "outOfRange" }).max(80, { error: "outOfRange" }),
  startsAt: dateField,
  endsAt: dateField,
  note: optionalText(120),
});

/** Dates come from <input type="date">; a deal starts at 00:00 and ends at 23:59 Pakistan time. */
function pkt(date: string, endOfDay: boolean) {
  return new Date(`${date}T${endOfDay ? "23:59:59" : "00:00:00"}+05:00`);
}

export async function createDealAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser("clinic_owner");
    const v = parseForm(dealSchema, form);
    await createOwnDeal(user.id, {
      treatmentId: v.treatmentId,
      percentOff: v.percentOff,
      startsAt: pkt(v.startsAt, false),
      endsAt: pkt(v.endsAt, true),
      note: v.note ?? "",
    });
    revalidatePath(localePath(lang, "/dashboard/deals"));
    revalidatePath(localePath(lang, "/deals"));
    return { ok: true, message: getDict(lang).deals.created };
  });
}

export async function endDealAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser("clinic_owner");
    const { dealId } = parseForm(z.object({ dealId: objectId }), form);
    await endOwnDeal(user.id, dealId);
    revalidatePath(localePath(lang, "/dashboard/deals"));
    revalidatePath(localePath(lang, "/deals"));
    return { ok: true, message: getDict(lang).deals.ended };
  });
}
