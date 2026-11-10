import type { IconName } from "@/components/ui/Icon";

/** One icon per treatment slug, shared by the home tiles and the Services menu. */
const TREATMENT_ICONS: Record<string, IconName> = {
  "acne-treatment": "heart",
  "laser-hair-removal": "sun",
  "skin-whitening": "star",
  facials: "user",
  "chemical-peel": "file",
  "pigmentation-treatment": "image",
  "scar-treatment": "check",
  "hair-loss-treatment": "globe",
};

export function treatmentIcon(slug: string): IconName {
  return TREATMENT_ICONS[slug] ?? "star";
}
