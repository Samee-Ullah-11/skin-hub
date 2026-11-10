import type { Lang } from "./config";

export type Section<T> = Record<Lang, T>;

export function section<T extends Record<string, unknown>>(en: T, ur: NoInfer<T>): Section<T> {
  return { en, ur };
}
