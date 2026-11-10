"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

export interface ServiceItem {
  slug: string;
  name: string;
  href: string;
  icon: IconName;
  /** Small photo shown instead of the icon. */
  image?: string;
  /** e.g. "3 clinics · from PKR 2,500" or "Coming soon" */
  detail: string;
}

/**
 * "Services" navbar tab: a dropdown with the treatment list on the left and, on the right,
 * a photo poster of whichever one is hovered or focused.
 * Opens on hover or click, closes on Escape, outside click or navigation.
 */
export function ServicesMenu({
  label,
  items,
  allHref,
  allLabel,
}: {
  label: string;
  items: ServiceItem[];
  allHref: string;
  allLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const wrap = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const panelId = useId();
  const active = pathname === allHref || pathname.startsWith(`${allHref}/`);
  const [preview, setPreview] = useState(0);
  const current = items[preview];

  // Close when the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function show() {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function hideSoon() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  }

  return (
    <li ref={wrap} onMouseEnter={show} onMouseLeave={hideSoon}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 whitespace-nowrap py-2 text-[15px] font-medium underline-offset-[10px] decoration-2 transition-colors hover:text-primary ${
          active || open ? "text-primary" : "text-ink"
        } ${active ? "underline" : ""}`}
      >
        {label}
        <Icon name="chevronDown" size={16} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-50 pt-3"
      >
        {/* Spans the navbar's width (the navbar is the positioning box), so it never leaves the screen. */}
        <div className="shadow-soft rise-in mx-auto grid w-fit max-w-full grid-cols-[auto_18rem] gap-4 rounded-3xl bg-surface p-4">
          {/* Left: plain text rows. Hovering or focusing one previews it on the right. */}
          <div className="flex flex-col">
            <ul className="grid grid-cols-2 gap-x-2">
              {items.map((it, i) => (
                <li key={it.slug}>
                  <Link
                    href={it.href}
                    aria-current={i === preview ? "true" : undefined}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setPreview(i)}
                    onFocus={() => setPreview(i)}
                    className={`block truncate rounded-xl px-3 py-1.5 text-[15px] transition-colors ${i === preview ? "bg-soft text-primary" : "text-ink"}`}
                  >
                    {it.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={allHref}
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-between gap-6 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-[filter] hover:brightness-110"
            >
              {allLabel}
              <Icon name="arrowRight" size={18} className="rtl:rotate-180" />
            </Link>
          </div>

          {/* Right: the previewed service as a small photo card with its name and detail. */}
          {current ? (
            <Link
              href={current.href}
              onClick={() => setOpen(false)}
              tabIndex={-1}
              aria-hidden="true"
              className="relative aspect-[4/3] self-start overflow-hidden rounded-2xl bg-[#0b1218] text-white"
            >
              {items.map((it, i) =>
                it.image ? (
                  <Image
                    key={it.slug}
                    src={it.image}
                    alt=""
                    fill
                    sizes="288px"
                    className={`object-cover transition-opacity duration-300 ease-out ${i === preview ? "opacity-100" : "opacity-0"}`}
                  />
                ) : null,
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span key={current.slug} className="fade-in absolute inset-x-4 bottom-4 flex flex-col gap-1">
                <span className="text-xl font-bold leading-tight">{current.name}</span>
                <span className="text-xs font-medium text-white/80">{current.detail}</span>
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}
