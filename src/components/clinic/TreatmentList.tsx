"use client";

import { Icon } from "@/components/ui/Icon";
import { SELECT_TREATMENT_EVENT } from "./BookingWidget";

/** Treatments with prices; tapping one adds it to the booking card's selection and scrolls there. */
export function TreatmentList({
  items,
  bookLabel,
}: {
  items: { id: string; name: string; price: string; onRequest: boolean; deal?: { badge: string; price?: string } }[];
  bookLabel: string;
}) {
  function pick(id: string) {
    window.dispatchEvent(new CustomEvent(SELECT_TREATMENT_EVENT, { detail: id }));
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((tr) => (
        <li key={tr.id}>
          <button
            type="button"
            onClick={() => pick(tr.id)}
            className="lift shadow-soft group flex w-full items-center justify-between gap-3 rounded-2xl bg-surface px-5 py-4 text-start"
          >
            <span className="flex flex-col">
              <span className="flex items-center gap-2 font-semibold group-hover:text-primary">
                {tr.name}
                {tr.deal ? <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold text-white">{tr.deal.badge}</span> : null}
              </span>
              {tr.deal?.price ? (
                <span className="flex items-baseline gap-2 text-sm">
                  <span className="text-muted line-through">{tr.price}</span>
                  <span className="font-semibold text-primary">{tr.deal.price}</span>
                </span>
              ) : (
                <span className={`text-sm ${tr.onRequest ? "text-muted" : "font-semibold text-primary"}`}>{tr.price}</span>
              )}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-chip px-3 py-1.5 text-sm font-semibold text-chip-ink">
              {bookLabel}
              <Icon name="arrowRight" size={16} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
