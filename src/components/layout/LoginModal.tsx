"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LoginForm } from "@/app/[lang]/(public)/(auth)/login/LoginForm";
import { Icon } from "@/components/ui/Icon";
import type { Dict } from "@/i18n";
import type { Lang } from "@/i18n/config";
import { Logo } from "./Logo";

type Side = "patient" | "clinic";
const OPEN_EVENT = "sh:open-login";

interface OpenDetail {
  next?: string;
  side?: Side;
}

/** Opens the floating login card from anywhere on the page. */
export function openLogin(detail: OpenDetail = {}) {
  window.dispatchEvent(new CustomEvent<OpenDetail>(OPEN_EVENT, { detail }));
}

/** A button that opens the floating login card. */
export function LoginButton({ label, className = "", side }: { label: string; className?: string; side?: Side }) {
  return (
    <button type="button" onClick={() => openLogin({ side })} aria-haspopup="dialog" className={className}>
      {label}
    </button>
  );
}

/**
 * The one floating login card for the page. Mounted once (in the header) for logged-out visitors.
 * Opens from LoginButton, from openLogin(), and from any click on a link to /login, keeping that
 * link's "next" and "as" values. Visiting /login directly still shows the full page.
 */
export function LoginHost({ lang, t, closeLabel }: { lang: Lang; t: Dict["auth"]; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<Side>("patient");
  const [next, setNext] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const card = useRef<HTMLDivElement>(null);

  // Close when the page changes (after logging in, or "Forgot password?").
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);

    function show(detail: OpenDetail) {
      setSide(detail.side ?? "patient");
      setNext(detail.next);
      setOpen(true);
    }
    function onOpen(e: Event) {
      show((e as CustomEvent<OpenDetail>).detail ?? {});
    }
    // Any link to /login opens the card instead of leaving the page.
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/login") return;
      if (window.location.pathname === "/login") return;
      e.preventDefault();
      show({ next: url.searchParams.get("next") ?? undefined, side: url.searchParams.get("as") === "clinic" ? "clinic" : undefined });
    }
    window.addEventListener(OPEN_EVENT, onOpen);
    document.addEventListener("click", onClick, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener(OPEN_EVENT, onOpen);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => card.current?.querySelector<HTMLInputElement>("input[type=email]")?.focus(), 50);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      before?.focus?.();
    };
  }, [open]);

  if (!mounted || !open) return null;

  // Patients return to where they were (or to the page the link asked for); clinics go to their dashboard.
  const here = pathname.startsWith("/login") || pathname.startsWith("/signup") ? undefined : pathname;
  const target = side === "clinic" ? (next?.startsWith("/dashboard") ? next : "/dashboard") : (next ?? here);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div className="fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-card-title"
        data-role={side === "clinic" ? "clinic" : "public"}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className="pop-in no-scrollbar relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-[2rem] bg-surface p-5 shadow-2xl sm:p-7"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={closeLabel}
          className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink"
        >
          <Icon name="x" size={20} />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 min-w-14 items-center justify-center rounded-2xl bg-chip px-4 text-xl">
            <Logo lang={lang} />
          </div>
          <h2 id="login-card-title" className="mt-3 text-2xl">
            {t.welcomeBack}
          </h2>
          <p className="mt-1 text-sm text-muted">{side === "clinic" ? t.loginClinicIntro : t.loginPatientIntro}</p>
        </div>
        <div role="tablist" aria-label={t.iAmA} className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-soft p-1">
          {(["patient", "clinic"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={side === s}
              onClick={() => setSide(s)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                side === s ? "bg-primary text-on-primary" : "text-ink hover:text-primary"
              }`}
            >
              {s === "clinic" ? t.clinicSide : t.patientSide}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <LoginForm key={side} lang={lang} t={t} next={target} side={side} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
