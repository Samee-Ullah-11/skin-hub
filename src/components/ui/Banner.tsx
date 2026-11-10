import type { ReactNode } from "react";
import type { StatusTone } from "./Chip";

type Tone = StatusTone | "info";

export function Banner({ tone = "info", title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  const style =
    tone === "info"
      ? { background: "var(--chip-bg)", color: "var(--chip-text)" }
      : { background: `var(--status-${tone}-bg)`, color: `var(--status-${tone}-fg)` };
  return (
    <div className="rounded-md px-4 py-3 text-[15px]" style={style} role={tone === "rejected" ? "alert" : "status"}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
    </div>
  );
}
