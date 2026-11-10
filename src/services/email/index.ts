import type { Types } from "mongoose";
import { site } from "@config/site";
import { dirOf, fmt, type Lang } from "@/i18n/config";
import { emails } from "@/i18n/dict/emails";
import { connectDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { EmailLog } from "@/models/Notification";
import { emailProvider } from "./provider";

export type EmailTemplate =
  | "verifyEmail"
  | "resetPassword"
  | "bookingRequestedPatient"
  | "bookingRequestedClinic"
  | "bookingConfirmed"
  | "bookingDeclined"
  | "bookingExpired"
  | "bookingExpiredClinic"
  | "bookingCancelled"
  | "bookingCompleted"
  | "reminder"
  | "clinicApproved"
  | "clinicRejected"
  | "clinicBlocked";

type Strings = (typeof emails)["en"];

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function renderEmail(
  lang: Lang,
  template: EmailTemplate,
  params: Record<string, string | number>,
  opts: { name: string; cta?: { url: string; label?: string }; extra?: string } = { name: "" },
) {
  const t = emails[lang] as Strings;
  const all = { site: site.name, ...params };
  const subject = fmt(t[`${template}_subject` as keyof Strings], all);
  const body = fmt(t[`${template}_body` as keyof Strings], all);
  const greeting = fmt(t.greeting, { name: opts.name });
  const signoff = fmt(t.signoff, all);
  const footer = fmt(t.footer, all);
  const ctaLabel = opts.cta?.label ?? t.openDashboard;

  const text = [greeting, "", body, opts.extra ?? "", opts.cta ? `${ctaLabel}: ${opts.cta.url}` : "", "", signoff, "", footer]
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");

  const dir = dirOf(lang);
  const font = lang === "ur" ? "'Noto Naskh Arabic', Tahoma, sans-serif" : "Arial, Helvetica, sans-serif";
  const html = `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#f5f8fb;padding:24px;font-family:${font};color:#1b2a3a;line-height:${lang === "ur" ? 2 : 1.6}">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce6ee;border-radius:10px">
<tr><td style="padding:24px 28px">
<p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:#0e5a8a">${escapeHtml(site.name)}</p>
<p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
<p style="margin:0 0 12px">${escapeHtml(body)}</p>
${opts.extra ? `<p style="margin:0 0 12px">${escapeHtml(opts.extra)}</p>` : ""}
${opts.cta ? `<p style="margin:20px 0"><a href="${escapeHtml(opts.cta.url)}" style="display:inline-block;background:#0e5a8a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold">${escapeHtml(ctaLabel)}</a></p><p style="margin:0 0 12px;font-size:13px;color:#5a6877;word-break:break-all" dir="ltr">${escapeHtml(opts.cta.url)}</p>` : ""}
<p style="margin:16px 0 0">${escapeHtml(signoff)}</p>
</td></tr></table>
<p style="max-width:560px;margin:12px auto 0;font-size:12px;color:#5a6877">${escapeHtml(footer)}</p>
</body></html>`;

  return { subject, text, html };
}

/** Sends one email and records the attempt. Never throws: a failed email must not fail the action that triggered it. */
export async function sendEmail(args: {
  to: string;
  lang: Lang;
  template: EmailTemplate;
  name: string;
  params?: Record<string, string | number>;
  cta?: { url: string; label?: string };
  extra?: string;
  bookingId?: Types.ObjectId;
}): Promise<boolean> {
  const provider = emailProvider();
  const rendered = renderEmail(args.lang, args.template, args.params ?? {}, {
    name: args.name,
    cta: args.cta,
    extra: args.extra,
  });
  let status: "sent" | "failed" = "sent";
  let error: string | undefined;
  try {
    await provider.send({ to: args.to, ...rendered, ctaUrl: args.cta?.url });
  } catch (err) {
    status = "failed";
    error = err instanceof Error ? err.message : String(err);
    logger.error("email send failed", { template: args.template, provider: provider.name, error });
  }
  try {
    await connectDb();
    await EmailLog.create({
      to: args.to,
      template: args.template,
      provider: provider.name,
      status,
      error,
      bookingId: args.bookingId,
    });
  } catch (err) {
    logger.error("email log write failed", { error: err });
  }
  return status === "sent";
}
