import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-0.5 text-sm font-medium text-chip-ink ${className}`}>
      {children}
    </span>
  );
}

export type StatusTone = "pending" | "approved" | "rejected" | "blocked";

const TONE_ICON: Record<StatusTone, "clock" | "check" | "x" | "x"> = {
  pending: "clock",
  approved: "check",
  rejected: "x",
  blocked: "x",
};

export function StatusChip({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold"
      style={{ background: `var(--status-${tone}-bg)`, color: `var(--status-${tone}-fg)` }}
    >
      <Icon name={TONE_ICON[tone]} size={14} />
      {label}
    </span>
  );
}

export function FeaturedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-sm font-semibold text-on-accent">
      <Icon name="star" size={14} filled />
      {label}
    </span>
  );
}

const CLINIC_TONES: Record<string, StatusTone> = {
  draft: "blocked",
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  blocked: "blocked",
};

const BOOKING_TONES: Record<string, StatusTone> = {
  pending: "pending",
  confirmed: "approved",
  completed: "approved",
  declined: "rejected",
  no_show: "rejected",
  cancelled_by_patient: "blocked",
  cancelled_by_clinic: "blocked",
  expired: "blocked",
};

export const clinicTone = (s: string): StatusTone => CLINIC_TONES[s] ?? "blocked";
export const bookingTone = (s: string): StatusTone => BOOKING_TONES[s] ?? "blocked";
