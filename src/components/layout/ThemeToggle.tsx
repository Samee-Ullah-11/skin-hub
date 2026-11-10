"use client";

import { Icon } from "@/components/ui/Icon";

type Theme = "system" | "light" | "dark";

/** Which theme is showing right now: a saved choice, otherwise the device setting. */
function currentTheme(): "light" | "dark" {
  const pinned = document.documentElement.getAttribute("data-theme");
  if (pinned === "light" || pinned === "dark") return pinned;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * One tap switches between light and dark. Until someone taps it, the site follows the
 * device setting. The icon is chosen by CSS so the server and browser always agree.
 */
export function ThemeToggle({ labels }: { initial?: Theme; labels: { system: string; light: string; dark: string } }) {
  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink"
      title={`${labels.light} / ${labels.dark}`}
    >
      {/* Light mode shows the moon (tap for dark); dark mode shows the sun (tap for light). */}
      <span className="theme-when-light">
        <Icon name="moon" size={20} />
        <span className="sr-only">{labels.dark}</span>
      </span>
      <span className="theme-when-dark">
        <Icon name="sun" size={20} />
        <span className="sr-only">{labels.light}</span>
      </span>
    </button>
  );
}
