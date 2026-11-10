"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

export function SideNav({ links, label }: { links: { href: string; label: string; exact?: boolean; icon?: IconName }[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 whitespace-nowrap rounded-xl border-s-4 px-3 py-2.5 text-[15px] transition-colors ${
                  active ? "border-primary bg-chip font-semibold text-primary" : "border-transparent font-medium text-ink hover:bg-soft hover:text-primary"
                }`}
              >
                {l.icon ? (
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary text-on-primary" : "bg-soft text-muted"}`}>
                    <Icon name={l.icon} size={16} />
                  </span>
                ) : null}
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
