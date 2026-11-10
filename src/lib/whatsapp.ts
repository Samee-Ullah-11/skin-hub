import { toWhatsAppNumber } from "./phone";

export function waLink(phone: string, text?: string): string {
  const number = toWhatsAppNumber(phone);
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${number}${query}`;
}
