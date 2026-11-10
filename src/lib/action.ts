import "server-only";
import { z } from "zod";
import { isLang, type Lang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface ActionState {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

export function formLang(form: FormData): Lang {
  const v = form.get("lang");
  return typeof v === "string" && isLang(v) ? v : "en";
}

function translate(lang: Lang, key: string): string {
  const errors = getDict(lang).errors as Record<string, string>;
  return errors[key] ?? errors.validation;
}

export function parseForm<S extends z.ZodType>(schema: S, form: FormData): z.infer<S> {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v !== "string") continue;
    if (k.endsWith("[]")) {
      const key = k.slice(0, -2);
      const list = (raw[key] as string[] | undefined) ?? [];
      list.push(v);
      raw[key] = list;
    } else if (k.includes(".")) {
      const [a, b] = k.split(".", 2);
      raw[a] = { ...((raw[a] as object) ?? {}), [b]: v };
    } else {
      raw[k] = v;
    }
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    throw new AppError("validation", "invalid_form", fieldErrors);
  }
  return result.data;
}

function echo(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === "string" && !/password|token|current/i.test(k)) values[k] = v;
  }
  return values;
}

/** Runs a form action and turns AppErrors into translated messages. Redirects thrown by next/navigation pass through. */
export async function runAction(form: FormData, fn: (lang: Lang) => Promise<ActionState | void>): Promise<ActionState> {
  const lang = formLang(form);
  try {
    return (await fn(lang)) ?? { ok: true };
  } catch (err) {
    if (err instanceof AppError) {
      const fieldErrors = err.fieldErrors
        ? Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, translate(lang, v)]))
        : undefined;
      return { ok: false, error: translate(lang, err.code), fieldErrors, values: echo(form) };
    }
    if (isRedirectLike(err)) throw err;
    logger.error("action failed", { error: err });
    return { ok: false, error: translate(lang, "internal"), values: echo(form) };
  }
}

function isRedirectLike(err: unknown): boolean {
  const digest = (err as { digest?: unknown })?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR"));
}
