import type { Types } from "mongoose";
import { features } from "@config/features";
import { fmt, localePath, type Lang } from "@/i18n/config";
import { notifications as notificationText } from "@/i18n/dict/notifications";
import { connectDb } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { Notification, type NotificationType } from "@/models/Notification";
import { User } from "@/models/User";
import { sendEmail, type EmailTemplate } from "../email";
import { whatsappChannel, type WhatsAppTemplate } from "./whatsapp";

type TextKey = keyof (typeof notificationText)["en"];

export interface NotifyInput {
  userId: Types.ObjectId | string;
  type: NotificationType;
  /** Defaults to the type; lets the patient and clinic sides of one event read differently. */
  textKey?: TextKey;
  params: Record<string, string>;
  /** Path without locale prefix, e.g. /account/bookings */
  link: string;
  email?: { template: EmailTemplate; params?: Record<string, string | number>; ctaPath?: string; extra?: string };
  whatsapp?: WhatsAppTemplate;
  bookingId?: Types.ObjectId;
  /** Lets callers format time-dependent params in the recipient's language. */
  paramsFor?: (lang: Lang) => Record<string, string>;
}

/** Fans one event out to in-app, email and (when enabled) WhatsApp. Failures are logged, never thrown. */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await connectDb();
    const user = await User.findById(input.userId, { email: 1, name: 1, locale: 1, phone: 1 }).lean();
    if (!user) return;
    const lang: Lang = user.locale ?? "en";
    const params = { ...input.params, ...(input.paramsFor?.(lang) ?? {}) };

    await Notification.create({
      userId: user._id,
      type: input.type,
      params: { ...params, textKey: input.textKey ?? input.type },
      link: input.link,
    });

    if (input.email) {
      await sendEmail({
        to: user.email,
        lang,
        template: input.email.template,
        name: user.name,
        params: { ...params, ...(input.email.params ?? {}) },
        cta: input.email.ctaPath ? { url: `${env().APP_URL}${localePath(lang, input.email.ctaPath)}` } : undefined,
        extra: input.email.extra,
        bookingId: input.bookingId,
      });
    }

    if (input.whatsapp && features.whatsappApi) {
      await whatsappChannel.send({ to: user.phone, template: input.whatsapp, params, lang });
    }
  } catch (err) {
    logger.error("notify failed", { type: input.type, error: err });
  }
}

export function renderNotification(lang: Lang, type: string, params: Record<string, string>): string {
  const t = notificationText[lang] as Record<string, string>;
  const key = params.textKey && t[params.textKey] ? params.textKey : type;
  return fmt(t[key] ?? type, params);
}

export async function listNotifications(userId: string, limit = 20) {
  await connectDb();
  const [items, unread] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ userId, readAt: null }),
  ]);
  return { items, unread };
}

export async function markAllRead(userId: string) {
  await connectDb();
  await Notification.updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
}
