"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";

/**
 * Phone menu: a ☰ button that slides a panel in from the side over a dimmed page.
 * Closes on the × button, Escape, a tap on the backdrop, a link tap or a page change.
 * Rendered in a portal because the navbar is transformed (which would trap a fixed panel).
 */
export function MobileDrawer({ label, closeLabel, children }: { label: string; closeLabel: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Close when the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trigger = button.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-soft"
      >
        <Icon name="menu" size={22} />
      </button>
      {mounted
        ? createPortal(
            <div className={`fixed inset-0 z-[60] lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
              <div
                className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
                onClick={() => setOpen(false)}
              />
              <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                tabIndex={-1}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a")) setOpen(false);
                }}
                className={`absolute inset-y-0 end-0 flex w-[min(22rem,86vw)] flex-col bg-surface shadow-2xl outline-none transition-transform ease-out motion-reduce:transition-none ${
                  open ? "translate-x-0 duration-300" : "translate-x-full duration-200 rtl:-translate-x-full"
                }`}
              >
                <div className="flex items-center justify-end p-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={closeLabel}
                    className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-soft"
                  >
                    <Icon name="x" size={22} />
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8">{children}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
