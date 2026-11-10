export const PLACEHOLDER_MARK = "[";

export const site = {
  name: "SH",
  logo: {
    src: "[LOGO PATH]",
    width: 140,
    height: 32,
  },
  supportEmail: "[SUPPORT EMAIL]",
  supportWhatsApp: "[SUPPORT WHATSAPP 923XXXXXXXXX]",
  /** Footer links; a placeholder shows the name as plain text until the URL is set. */
  social: {
    Instagram: "[INSTAGRAM URL]",
    TikTok: "[TIKTOK URL]",
    X: "[X URL]",
  },
  /** Real photos only (your own or licensed clinic photos). Put files in /public/images and set the paths. */
  heroImages: {
    patient: "[HERO IMAGE PATIENT /images/...]",
    clinic: "[HERO IMAGE CLINIC /images/...]",
  },
  defaultCitySlug: "peshawar",
  timeZone: "Asia/Karachi",
  currency: "PKR",
} as const;

export function isPlaceholder(value: string): boolean {
  return value.startsWith(PLACEHOLDER_MARK) && value.endsWith("]");
}
