"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { useCycle } from "./useCycle";

export interface TrustItem {
  icon: IconName;
  title: string;
  body: string;
}

/** The trust points; one pops forward at a time and the spotlight moves on every few seconds. */
export function TrustCards({ items }: { items: TrustItem[] }) {
  const { active, setActive, pause } = useCycle(items.length, 3500);
  return (
    <ul className="grid grid-cols-2 gap-4 py-3 lg:grid-cols-4" {...pause}>
      {items.map((x, i) => {
        const on = i === active;
        return (
          <li key={x.title} onMouseEnter={() => setActive(i)} className={on ? "relative z-10" : ""}>
            <div
              className={`flex h-full flex-col gap-3 rounded-3xl p-5 transition-[transform,opacity,background-color,color,box-shadow] duration-500 ease-out ${
                on ? "scale-105 bg-primary text-on-primary shadow-2xl" : "shadow-soft scale-95 bg-surface opacity-75"
              }`}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${on ? "bg-white/20 text-white" : "bg-chip text-chip-ink"}`}>
                <Icon name={x.icon} size={22} />
              </span>
              <p className="font-semibold">{x.title}</p>
              <p className={`text-sm ${on ? "text-white/85" : "text-muted"}`}>{x.body}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
