import type { Lang } from "./config";
import { admin } from "./dict/admin";
import { auth } from "./dict/auth";
import { common, errors, footer, nav, slots, status } from "./dict/common";
import { dashboard } from "./dict/dashboard";
import { emails } from "./dict/emails";
import { notifications } from "./dict/notifications";
import { account, clinicBookings, clinicPage, home, search } from "./dict/public";
import { showcase } from "./dict/showcase";
import { deals } from "./dict/deals";

const sections = { common, nav, footer, status, errors, slots, auth, emails, dashboard, notifications, admin, home, search, clinicPage, account, clinicBookings, showcase, deals };

type Sections = typeof sections;
export type Dict = { [K in keyof Sections]: Sections[K]["en"] };

const cache: Partial<Record<Lang, Dict>> = {};

export function getDict(lang: Lang): Dict {
  const hit = cache[lang];
  if (hit) return hit;
  const built = Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v[lang]])) as Dict;
  cache[lang] = built;
  return built;
}

/** Urdu copy is a first draft. Set to true once a native speaker has reviewed every string in src/i18n/dict. */
export const URDU_REVIEWED = false;
