"use server";

import { z } from "zod";
import { fmt } from "@/i18n/config";
import { getDict } from "@/i18n";
import { parseForm, runAction, type ActionState } from "@/lib/action";
import { clientIp } from "@/lib/request";
import { joinWaitlist, saveContactMessage } from "@/services/public";
import { email, phone, text } from "@/validation/common";

export async function waitlistAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const v = parseForm(z.object({ email, city: z.string().max(60), cityName: z.string().max(80) }), form);
    await joinWaitlist({ email: v.email, citySlug: v.city, lang }, await clientIp());
    return { ok: true, message: fmt(getDict(lang).search.waitlistDone, { city: v.cityName }) };
  });
}

/** Home page "hear when new clinics join" box; stored with the city waitlist. */
export async function newsletterAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const v = parseForm(z.object({ email, city: z.string().max(60), cityName: z.string().max(80) }), form);
    await joinWaitlist({ email: v.email, citySlug: v.city, lang }, await clientIp());
    return { ok: true, message: fmt(getDict(lang).showcase.newsletterDone, { city: v.cityName }) };
  });
}

export async function contactAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const v = parseForm(
      z.object({
        name: text(80, 2),
        email,
        phone: z.union([z.literal(""), phone]).optional(),
        message: text(2000, 10),
      }),
      form,
    );
    await saveContactMessage({ ...v, phone: v.phone || undefined }, await clientIp());
    return { ok: true, message: getDict(lang).home.contactSent };
  });
}
