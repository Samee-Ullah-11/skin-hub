"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Slides its content in from a side the first time it scrolls into view. */
export function Reveal({
  from = "up",
  delay = 0,
  className = "",
  children,
}: {
  from?: "left" | "right" | "up";
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-from={from}
      data-shown={shown ? "" : undefined}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}
