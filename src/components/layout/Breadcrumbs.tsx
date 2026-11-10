"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

interface Crumb {
  href: string;
  label: string;
  exact?: boolean;
}

/**
 * "Home › Page" trail for dashboard pages. Home is the dashboard overview; the page is the
 * menu entry whose path matches the current URL (nested pages match their section).
 */
export function Breadcrumbs({ homeHref, homeLabel, links, ariaLabel }: { homeHref: string; homeLabel: string; links: Crumb[]; ariaLabel: string }) {
  const pathname = usePathname();
  const current = links
    .filter((l) => !l.exact && l.href !== homeHref && (pathname === l.href || pathname.startsWith(`${l.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav aria-label={ariaLabel} className="mb-4 flex items-center gap-1.5 text-sm text-muted">
      <Link href={homeHref} className="inline-flex items-center gap-1.5 rounded-md hover:text-primary" aria-current={current ? undefined : "page"}>
        <Icon name="home" size={15} />
        <span className={current ? "" : "font-semibold text-ink"}>{homeLabel}</span>
      </Link>
      {current ? (
        <>
          <Icon name="chevronRight" size={14} className="rtl:rotate-180" aria-hidden="true" />
          <span className="font-semibold text-ink" aria-current="page">
            {current.label}
          </span>
        </>
      ) : null}
    </nav>
  );
}
