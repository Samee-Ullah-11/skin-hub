import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

/** Small box: icon, title, a value or short status, linking to where the work is done. */
export function Tile({
  href,
  icon,
  title,
  value,
  hint,
  tone = "default",
  external,
}: {
  href: string;
  icon: IconName;
  title: string;
  value?: ReactNode;
  hint?: string;
  tone?: "default" | "attention" | "done";
  external?: boolean;
}) {
  const toneClass =
    tone === "attention"
      ? "bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)]"
      : tone === "done"
        ? "bg-[var(--status-approved-bg)] text-[var(--status-approved-fg)]"
        : "bg-chip text-chip-ink";
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="lift shadow-soft group flex h-full flex-col gap-3 rounded-2xl bg-surface p-4"
    >
      <span className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon name={icon} size={20} />
        </span>
        <Icon name="arrowRight" size={16} className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-muted">{title}</span>
        {value !== undefined ? <span className="text-2xl font-semibold leading-tight">{value}</span> : null}
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </span>
    </Link>
  );
}
