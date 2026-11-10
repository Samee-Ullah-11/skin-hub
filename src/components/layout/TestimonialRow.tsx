"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";

export interface TestimonialView {
  id: string;
  name: string;
  quote: string;
}

/**
 * Testimonials drift right to left on a curved rail: each card turns toward the viewer as it reaches the
 * middle (`.curve`, scroll-driven) and the row loops over a duplicated copy. Pauses on hover, focus and touch.
 */
export function TestimonialRow({ items }: { items: TestimonialView[] }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sign = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    let paused = false;
    let pos = 0;
    let last = 0;
    let raf = 0;
    const tick = (t: number) => {
      // Width of one copy of the list: jumping back by exactly this is invisible.
      const unit = (el.children[items.length] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft;
      if (!paused && last && el.scrollWidth - unit > el.clientWidth) {
        pos += Math.min(t - last, 50) * 0.04; // 40px/s; cap the jump after a hidden tab
        if (pos >= unit) pos -= unit;
        el.scrollLeft = sign * pos;
      } else pos = Math.abs(el.scrollLeft);
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const on = () => (paused = true);
    const off = () => (paused = false);
    el.addEventListener("pointerenter", on);
    el.addEventListener("pointerleave", off);
    el.addEventListener("focusin", on);
    el.addEventListener("focusout", off);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", on);
      el.removeEventListener("pointerleave", off);
      el.removeEventListener("focusin", on);
      el.removeEventListener("focusout", off);
    };
  }, [items.length]);

  // shortcut: at least 12 cards (~4000px) covers screens up to ~3000px wide; wider ones see the row stand still.
  const copies = Math.max(2, Math.ceil(12 / items.length));
  return (
    <ul ref={ref} className="-mx-5 flex gap-5 overflow-x-auto px-5 py-8 [perspective:1200px] sm:mx-0" style={{ scrollbarWidth: "none" }}>
      {Array.from({ length: copies }, () => items).flat().map((x, i) => (
        <li key={`${x.id}-${i}`} aria-hidden={i >= items.length || undefined} className="curve w-72 shrink-0 sm:w-80">
          <figure className="shadow-soft flex h-full flex-col gap-5 rounded-3xl bg-surface p-6">
            <Icon name="chat" size={28} className="text-primary/50" />
            <blockquote className="flex-1 text-[17px]">{x.quote}</blockquote>
            <figcaption className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-chip font-display text-lg font-semibold text-chip-ink" aria-hidden="true">
                {x.name.trim().charAt(0)}
              </span>
              <span className="font-semibold">{x.name}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
