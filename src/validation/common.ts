import { z } from "zod";
import { isPakistaniMobile, isPakistaniPhone, normalizePhone } from "@/lib/phone";

/** Validation messages are translation keys under `errors`. */
export const msg = {
  required: "required",
  invalidEmail: "invalidEmail",
  invalidPhone: "invalidPhone",
  tooShort: "tooShort",
  tooLong: "tooLong",
} as const;

export const text = (max: number, min = 1) =>
  z
    .string({ error: msg.required })
    .trim()
    .min(min, { error: min <= 1 ? msg.required : msg.tooShort })
    .max(max, { error: msg.tooLong });

export const optionalText = (max: number) => z.string().trim().max(max, { error: msg.tooLong }).default("");

export const email = z
  .string({ error: msg.required })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: msg.invalidEmail }).max(254, { error: msg.tooLong }));

export const phone = z
  .string({ error: msg.required })
  .trim()
  .refine(isPakistaniPhone, { error: msg.invalidPhone })
  .transform(normalizePhone);

export const mobile = z
  .string({ error: msg.required })
  .trim()
  .refine(isPakistaniMobile, { error: msg.invalidPhone })
  .transform(normalizePhone);

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, { error: "not_found" });

export const localizedInput = (max: number, required = true) =>
  z.object({ en: required ? text(max) : optionalText(max), ur: optionalText(max) });

export const lang = z.enum(["en", "ur"]).catch("en");

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal(""), z.undefined(), z.null()])
  .transform((v) => v === "on" || v === "true" || v === "1");

export const pkr = z.coerce.number({ error: msg.required }).int().min(0).max(10_000_000);
