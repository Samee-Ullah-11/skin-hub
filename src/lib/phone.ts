const MOBILE = /^(?:\+92|0092|92|0)?(3\d{9})$/;
const LANDLINE = /^(?:\+92|0092|92|0)?([1-9]\d{8,9})$/;

function digits(input: string): string {
  return input.replace(/[\s\-().]/g, "");
}

/** Accepts Pakistani mobile (03XX XXXXXXX) and landline numbers in local or +92 form. */
export function isPakistaniPhone(input: string): boolean {
  const d = digits(input);
  return MOBILE.test(d) || LANDLINE.test(d);
}

export function isPakistaniMobile(input: string): boolean {
  return MOBILE.test(digits(input));
}

/** Normalises to +92XXXXXXXXXX. Returns the input unchanged when it is not a Pakistani number. */
export function normalizePhone(input: string): string {
  const d = digits(input);
  const m = d.match(MOBILE) ?? d.match(LANDLINE);
  return m ? `+92${m[1]}` : input.trim();
}

export function toWhatsAppNumber(input: string): string {
  return normalizePhone(input).replace(/\D/g, "");
}
