import { isPlaceholder, site } from "../config/site";
import { URDU_REVIEWED } from "../src/i18n";

const missing: string[] = [];

function walk(value: unknown, path: string) {
  if (typeof value === "string") {
    if (isPlaceholder(value)) missing.push(`config/site.ts → ${path}: ${value}`);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
  }
}

walk(site, "");

if (!URDU_REVIEWED) {
  missing.push("src/i18n/dict/*: Urdu strings are a first draft. Have a native speaker review them, then set URDU_REVIEWED = true in src/i18n/index.ts");
}

if (missing.length) {
  console.error(`Placeholders still to fill before launch (${missing.length}):\n`);
  for (const m of missing) console.error(`  - ${m}`);
  console.error("\nAlso check by hand: legal text in src/i18n/dict/pages.ts, and run npm run seed:wipe-samples on production.");
  process.exit(1);
}

console.log("No placeholders left.");
