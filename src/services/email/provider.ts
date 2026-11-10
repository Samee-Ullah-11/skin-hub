import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { site } from "@config/site";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** The main link in the email, kept so the local inbox can show it as a button. */
  ctaUrl?: string;
  /** Set by the console provider when it stores the email. */
  at?: Date;
}

export interface EmailProvider {
  readonly name: string;
  send(email: OutgoingEmail): Promise<void>;
}

const globalInbox = globalThis as unknown as { __fakeInbox?: OutgoingEmail[] };

export function fakeInbox(): OutgoingEmail[] {
  globalInbox.__fakeInbox ??= [];
  return globalInbox.__fakeInbox;
}

class ConsoleProvider implements EmailProvider {
  readonly name = "console";
  async send(email: OutgoingEmail) {
    const inbox = fakeInbox();
    inbox.unshift({ ...email, at: new Date() });
    inbox.length = Math.min(inbox.length, 50);
    logger.info("email (console provider)", { to: email.to, subject: email.subject, body: email.text });
  }
}

class BrevoProvider implements EmailProvider {
  readonly name = "brevo";
  constructor(private apiKey: string, private from: string) {}
  async send(email: OutgoingEmail) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": this.apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: this.from, name: site.name },
        to: [{ email: email.to }],
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
      }),
    });
    if (!res.ok) throw new Error(`Brevo responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

class ResendProvider implements EmailProvider {
  readonly name = "resend";
  constructor(private apiKey: string, private from: string) {}
  async send(email: OutgoingEmail) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: `${site.name} <${this.from}>`,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/** True while emails only go to the in-memory inbox (console provider, not production). */
export function isLocalInbox(): boolean {
  const e = env();
  return e.EMAIL_PROVIDER === "console" && e.NODE_ENV !== "production";
}

/** Emails the console provider kept for one address (newest first), or all of them. */
export function localInbox(to?: string): OutgoingEmail[] {
  if (!isLocalInbox()) return [];
  const all = fakeInbox();
  return to ? all.filter((m) => m.to.toLowerCase() === to.toLowerCase()) : all;
}

let provider: EmailProvider | undefined;

export function emailProvider(): EmailProvider {
  if (provider) return provider;
  const e = env();
  if (e.EMAIL_PROVIDER === "brevo") provider = new BrevoProvider(e.BREVO_API_KEY!, e.EMAIL_FROM);
  else if (e.EMAIL_PROVIDER === "resend") provider = new ResendProvider(e.RESEND_API_KEY!, e.EMAIL_FROM);
  else provider = new ConsoleProvider();
  return provider;
}
