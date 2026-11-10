import { z } from "zod";
import { localizedInput, mobile, msg, objectId, optionalText, phone, text } from "./common";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: msg.required });
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export const clinicProfileSchema = z.object({
  name: localizedInput(120),
  categoryId: objectId,
  provinceId: objectId,
  cityId: objectId,
  areaId: objectId,
  address: localizedInput(300),
  lat: z.coerce.number().min(23).max(37.5).optional(),
  lng: z.coerce.number().min(60).max(78).optional(),
  phone,
  whatsapp: mobile,
  description: z.object({ en: text(3000, 30), ur: optionalText(3000) }),
  treatments: z
    .array(z.object({ treatmentId: objectId, fromPricePkr: z.number().int().min(0).max(10_000_000).optional() }))
    .max(100),
});

export const doctorSchema = z
  .object({
    name: localizedInput(100),
    gender: z.enum(["female", "male"]).optional(),
    specialty: localizedInput(120, false),
    qualifications: optionalText(300),
    bio: localizedInput(1000, false),
    slotMinutes: z.coerce.number().int().refine((n) => [15, 20, 30, 45, 60].includes(n)),
    weekly: z
      .array(
        z.object({
          weekday: z.number().int().min(0).max(6),
          start: time,
          end: time,
          breaks: z.array(z.object({ start: time, end: time })).max(3),
        }),
      )
      .max(7),
    blockedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(120),
    active: z.boolean(),
  })
  .superRefine((d, ctx) => {
    d.weekly.forEach((w) => {
      if (minutes(w.end) - minutes(w.start) < d.slotMinutes) {
        ctx.addIssue({ code: "custom", path: [`day_${w.weekday}`], message: "invalidHours" });
      }
      for (const b of w.breaks) {
        if (minutes(b.end) <= minutes(b.start) || minutes(b.start) < minutes(w.start) || minutes(b.end) > minutes(w.end)) {
          ctx.addIssue({ code: "custom", path: [`day_${w.weekday}`], message: "invalidBreak" });
        }
      }
    });
  });

export const locationRequestSchema = z.object({
  kind: z.enum(["city", "area"]),
  provinceId: objectId,
  cityId: objectId.optional(),
  name: text(80, 2),
});
