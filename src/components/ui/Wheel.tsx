"use client";

import { useCallback, useEffect, useRef } from "react";

export interface WheelOption {
  value: string;
  label: string;
}

const ROW = 40; // px per row
const VISIBLE = 5; // rows shown; the middle one is selected

/**
 * A scroll wheel like the iPhone date/time picker: scroll or drag up and down, it snaps the
 * nearest option into the highlighted middle row. Also works with clicks and the arrow keys.
 */
export function Wheel({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: WheelOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const settle = useRef<number | undefined>(undefined);
  // True while the wheel is moving itself to match a new value, so that motion is not read as a pick.
  const selfMoving = useRef(false);
  const selfTimer = useRef<number | undefined>(undefined);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  // Keep the wheel's position in step with the selected value.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const target = index * ROW;
    if (Math.abs(el.scrollTop - target) > 2) {
      selfMoving.current = true;
      window.clearTimeout(selfTimer.current);
      el.scrollTo({ top: target, behavior: "smooth" });
      selfTimer.current = window.setTimeout(() => (selfMoving.current = false), 450);
    }
  }, [index, options.length]);

  const pick = useCallback(
    (i: number) => {
      const o = options[Math.min(options.length - 1, Math.max(0, i))];
      if (o && o.value !== value) onChange(o.value);
      else box.current?.scrollTo({ top: Math.max(0, Math.min(options.length - 1, i)) * ROW, behavior: "smooth" });
    },
    [options, value, onChange],
  );

  function onScroll() {
    if (selfMoving.current) return;
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = box.current;
      if (el) pick(Math.round(el.scrollTop / ROW));
    }, 120);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") pick(index + 1);
    else if (e.key === "ArrowUp") pick(index - 1);
    else if (e.key === "Home") pick(0);
    else if (e.key === "End") pick(options.length - 1);
    else return;
    e.preventDefault();
  }

  return (
    <div className={`relative ${className}`} style={{ height: ROW * VISIBLE }}>
      {/* Highlight band behind the middle row */}
      <div
        className="pointer-events-none absolute inset-x-1 rounded-xl bg-surface shadow-sm ring-1 ring-primary/30"
        style={{ top: ROW * 2, height: ROW }}
        aria-hidden="true"
      />
      <div
        ref={box}
        role="listbox"
        aria-label={label}
        aria-activedescendant={options[index] ? `${label}-${options[index].value}` : undefined}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={onKey}
        className="wheel relative h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        style={{ paddingBlock: ROW * 2 }}
      >
        {options.map((o, i) => {
          const distance = Math.abs(i - index);
          return (
            <div
              key={o.value}
              id={`${label}-${o.value}`}
              role="option"
              aria-selected={i === index}
              onClick={() => pick(i)}
              className={`flex snap-center cursor-pointer items-center justify-center select-none transition-[opacity,transform,color] duration-150 ${
                i === index ? "font-semibold text-primary" : "text-ink"
              }`}
              style={{
                height: ROW,
                opacity: distance === 0 ? 1 : distance === 1 ? 0.55 : 0.25,
                transform: `scale(${distance === 0 ? 1.08 : distance === 1 ? 0.95 : 0.85})`,
              }}
            >
              {o.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
