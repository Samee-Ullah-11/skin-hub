"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * Fixed header that hides while scrolling down and returns on scroll up.
 * Transparent at the top of the page; gets a surface and a soft shadow once scrolled.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - last) < 6) return;
      // Keep it open while a menu inside is open.
      const menuOpen = Boolean(document.querySelector('header details[open], header [aria-expanded="true"]'));
      setHidden(!menuOpen && y > last && y > 80);
      last = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      onFocusCapture={() => setHidden(false)}
      style={{ top: scrolled ? 0 : "var(--announce-h)" }}
      className={`fixed inset-x-0 z-40 transition-[transform,top] duration-300 ease-out motion-reduce:transition-none ${
        hidden ? "-translate-y-[120%]" : "translate-y-0"
      }`}
    >
      {/* Floating white bar; a stronger shadow once the page is scrolled. */}
      <div className="px-3 pt-3 md:px-5">
        <div
          className={`relative mx-auto max-w-[1240px] rounded-full bg-surface/95 backdrop-blur-md transition-shadow duration-300 ${
            scrolled ? "shadow-soft" : "shadow-sm"
          }`}
        >
          {children}
        </div>
      </div>
    </header>
  );
}

function isActive(href: string, pathname: string, as: string | null) {
  const [path, query] = href.split("?");
  if (path !== pathname) return false;
  const want = new URLSearchParams(query ?? "").get("as");
  return want === as;
}

/** Plain text tab; the current page gets an underline, nothing else. */
export function NavTab({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  const pathname = usePathname();
  const as = useSearchParams().get("as");
  const active = isActive(href, pathname, as);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap py-2 text-[15px] font-medium underline-offset-[10px] decoration-2 transition-colors hover:text-primary ${
        active ? "text-primary underline" : "text-ink"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

/**
 * Side-menu link. The current page gets a light blue background and a dark blue line on its
 * leading edge; other links get a soft hover.
 */
export function DrawerLink({ href, children, icon, exact }: { href: string; children: ReactNode; icon?: IconName; exact?: boolean }) {
  const pathname = usePathname();
  const path = href.split("?")[0];
  const active = path === "/" || exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-e-xl border-s-4 px-3 py-2.5 text-[15px] font-medium transition-colors ${
        active ? "border-primary bg-chip font-semibold text-chip-ink" : "border-transparent hover:bg-soft hover:text-primary"
      }`}
    >
      {icon ? <Icon name={icon} size={18} className={active ? "text-primary" : "text-muted"} /> : null}
      {children}
    </Link>
  );
}
