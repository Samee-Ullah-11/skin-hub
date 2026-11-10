"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

export interface BottomTab {
  key: "profile" | "home" | "saved" | "search";
  href: string;
  label: string;
  icon: IconName;
  /** Paths (without query) that count as this tab being active; prefix with "=" for an exact match. */
  match: string[];
}

function isActive(tab: BottomTab, pathname: string) {
  // "=/path" means an exact match; "/" is always exact.
  return tab.match.some((m) =>
    m.startsWith("=") ? pathname === m.slice(1) : m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(`${m}/`),
  );
}

/** Floating bottom bar for phones: icons only, the active tab also shows its label. */
export function BottomNav({ tabs, label }: { tabs: BottomTab[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-full bg-surface p-2 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.35)] ring-1 ring-line lg:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-center justify-between gap-1">
        {tabs.map((tab) => {
          const active = isActive(tab, pathname);
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 items-center gap-2 rounded-full transition-colors duration-200 ${
                  active ? "bg-primary px-5 text-on-primary" : "w-12 justify-center text-muted hover:text-primary"
                }`}
              >
                <Icon name={tab.icon} size={22} filled={active && tab.key === "saved"} />
                {active ? <span className="text-sm font-semibold">{tab.label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
