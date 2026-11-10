import { z } from "zod";
import { email, mobile, msg, text } from "./common";

export const password = z
  .string({ error: msg.required })
  .min(8, { error: "passwordTooShort" })
  .max(200, { error: msg.tooLong });

export const signupSchema = z.object({
  name: text(80, 2),
  email,
  phone: mobile,
  password,
  role: z.enum(["patient", "clinic_owner"]),
  agree: z.literal("on", { error: "mustAgree" }),
});

export const clinicSignupSchema = z.object({
  clinicName: text(120, 2),
  cityId: z.string({ error: msg.required }).regex(/^[a-f0-9]{24}$/, { error: msg.required }),
  name: text(80, 2),
  email,
  phone: mobile,
  password,
  agree: z.literal("on", { error: "mustAgree" }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: msg.required }).max(200),
  next: z.string().max(300).optional(),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password,
});

export const profileSchema = z.object({
  name: text(80, 2),
  phone: mobile,
  locale: z.enum(["en", "ur"]),
});

export const changePasswordSchema = z.object({
  current: z.string().min(1, { error: msg.required }),
  password,
});
