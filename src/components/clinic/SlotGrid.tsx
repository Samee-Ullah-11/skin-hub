"use client";

import { Icon } from "@/components/ui/Icon";

export type SlotState = "available" | "taken" | "mine" | "unavailable";

export interface SlotView {
  startUtc: string;
  /** Clinic-local time "HH:MM" (24-hour), used by the time wheels. */
  time?: string;
  label: string;
  state: SlotState;
}

export interface SlotLabels {
  available: string;
  booked: string;
  yourRequest: string;
  unavailable: string;
  slotLabel: string;
}

const crossBg =
  "linear-gradient(to top right, transparent calc(50% - 1px), var(--slot-cross) calc(50% - 1px), var(--slot-cross) calc(50% + 1px), transparent calc(50% + 1px))";

function stateText(state: SlotState, labels: SlotLabels) {
  if (state === "taken") return labels.booked;
  if (state === "mine") return labels.yourRequest;
  if (state === "unavailable") return labels.unavailable;
  return labels.available;
}

export function SlotGrid({
  slots,
  selected,
  onSelect,
  labels,
}: {
  slots: SlotView[];
  selected?: string;
  onSelect?: (startUtc: string) => void;
  labels: SlotLabels;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" role="list">
      {slots.map((slot) => {
        const clickable = slot.state === "available";
        const isSelected = selected === slot.startUtc;
        const text = stateText(slot.state, labels);
        const aria = labels.slotLabel.replace("{time}", slot.label).replace("{state}", text);
        let cls =
          "relative flex h-14 w-full flex-col items-center justify-center rounded-md border text-sm font-semibold transition-colors";
        if (slot.state === "available") {
          cls += isSelected
            ? " border-primary bg-primary text-on-primary"
            : " border-line bg-surface text-ink hover:border-primary";
        } else if (slot.state === "mine") {
          cls += " border-primary bg-chip text-chip-ink cursor-not-allowed";
        } else {
          cls += " border-line text-[var(--slot-taken-fg)] cursor-not-allowed";
        }
        return (
          <li key={slot.startUtc}>
            <button
              type="button"
              className={cls}
              style={slot.state === "taken" ? { background: `${crossBg}, var(--slot-taken-bg)` } : slot.state === "unavailable" ? { background: "var(--slot-taken-bg)" } : undefined}
              aria-disabled={!clickable}
              aria-pressed={clickable ? isSelected : undefined}
              aria-label={aria}
              onClick={() => clickable && onSelect?.(slot.startUtc)}
            >
              <span className={slot.state === "taken" ? "line-through decoration-2" : ""}>{slot.label}</span>
              {slot.state !== "available" ? (
                <span className="flex items-center gap-0.5 text-xs font-medium">
                  {slot.state === "taken" ? <Icon name="x" size={12} /> : null}
                  {text}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
