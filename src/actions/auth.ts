"use server";

import { cookies } from "next/headers";
import { GUEST_LIKES_COOKIE, parseGuestLikes } from "@/lib/guest-likes";
import { mergeGuestLikes } from "@/services/engagement";
import { redirect } from "next/navigation";
import { localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { parseForm, runAction, type ActionState } from "@/lib/action";
import { requireUser, startSession } from "@/lib/auth/session";
import { clientIp } from "@/lib/request";
import * as authService from "@/services/auth";
import { changePasswordSchema, clinicSignupSchema, forgotSchema, loginSchema, profileSchema, resetSchema, signupSchema } from "@/validation/auth";

function safeNext(next: string | undefined, fallback: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) return next;
  return fallback;
}

function homeFor(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "clinic_owner") return "/dashboard";
  return "/account/bookings";
}

/** Hearts a visitor tapped before logging in move into their patient account; the cookie is then cleared. */
async function adoptGuestLikes(user: { _id: unknown; role: string }) {
  if (user.role !== "patient") return;
  const jar = await cookies();
  const ids = parseGuestLikes(jar.get(GUEST_LIKES_COOKIE)?.value);
  if (!ids.length) return;
  await mergeGuestLikes(String(user._id), ids);
  jar.delete(GUEST_LIKES_COOKIE);
}

export async function signupAction(_: ActionState, form: FormData): Promise<ActionState> {
  let target = "";
  const state = await runAction(form, async (lang) => {
    const input = parseForm(signupSchema, form);
    const user = await authService.signup(input, { ip: await clientIp(), lang });
    await startSession(user);
    await adoptGuestLikes(user);
    target = localePath(lang, `/verify-email/sent?email=${encodeURIComponent(user.email)}`);
  });
  if (target) redirect(target);
  return state;
}

export async function clinicSignupAction(_: ActionState, form: FormData): Promise<ActionState> {
  let target = "";
  const state = await runAction(form, async (lang) => {
    const input = parseForm(clinicSignupSchema, form);
    const user = await authService.signupClinic(input, { ip: await clientIp(), lang });
    await startSession(user);
    target = localePath(lang, `/verify-email/sent?email=${encodeURIComponent(user.email)}`);
  });
  if (target) redirect(target);
  return state;
}

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  let target = "";
  const state = await runAction(form, async (lang) => {
    const input = parseForm(loginSchema, form);
    const user = await authService.login(input, { ip: await clientIp() });
    await startSession(user);
    await adoptGuestLikes(user);
    const home = homeFor(user.role);
    // Clinic owners and admins always land on their dashboard; a "next" from a public page would strand them on the landing page.
    const next = user.role === "patient" || input.next?.startsWith(home) ? input.next : undefined;
    target = localePath(lang, safeNext(next, home));
  });
  if (target) redirect(target);
  return state;
}

export async function verifyEmailAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const token = String(form.get("token") ?? "");
    try {
      await authService.verifyEmail(token);
    } catch {
      return { ok: false, error: getDict(lang).auth.verifyFailed };
    }
    return { ok: true, message: getDict(lang).auth.verifyOk };
  });
}

export async function resendVerificationAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser();
    await authService.resendVerification(user.id, lang);
    return { ok: true, message: getDict(lang).auth.resent };
  });
}

export async function forgotPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const { email } = parseForm(forgotSchema, form);
    await authService.requestPasswordReset(email, { ip: await clientIp(), lang });
    return { ok: true, message: getDict(lang).auth.forgotDone };
  });
}

export async function resetPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const { token, password } = parseForm(resetSchema, form);
    try {
      await authService.resetPassword(token, password, { ip: await clientIp() });
    } catch (err) {
      if ((err as { code?: string }).code === "invalid_state") return { ok: false, error: getDict(lang).auth.resetFailed };
      throw err;
    }
    return { ok: true, message: getDict(lang).auth.resetDone };
  });
}

export async function updateProfileAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser();
    const input = parseForm(profileSchema, form);
    await authService.updateProfile(user.id, input);
    return { ok: true, message: getDict(lang).auth.profileSaved };
  });
}

export async function changePasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const session = await requireUser();
    const { current, password } = parseForm(changePasswordSchema, form);
    const user = await authService.changePassword(session.id, current, password);
    await startSession(user);
    return { ok: true, message: getDict(lang).auth.passwordChanged };
  });
}
