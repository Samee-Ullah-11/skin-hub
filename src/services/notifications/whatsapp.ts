import type { Lang } from "@/i18n/config";
import { logger } from "@/lib/logger";

export type WhatsAppTemplate = "new_request_clinic" | "request_received_patient" | "confirmed" | "declined" | "reminder";

export interface WhatsAppMessage {
  to: string;
  template: WhatsAppTemplate;
  params: Record<string, string>;
  lang: Lang;
}

/**
 * Placeholder for the WhatsApp Business API. It only logs. It is called only when
 * features.whatsappApi is true. See the README for the five template texts to register.
 */
export const whatsappChannel = {
  async send(message: WhatsAppMessage): Promise<void> {
    logger.info("whatsapp channel stub: message not sent", { template: message.template, lang: message.lang });
  },
};
