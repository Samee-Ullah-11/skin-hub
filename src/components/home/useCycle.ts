"use client";

import { useEffect, useState } from "react";

/** Steps `active` through `count` items every `ms`; paused while hovered or focused, when the tab is hidden, or for reduced motion. */
export function useCycle(count: number, ms: number) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % count);
    }, ms);
    return () => clearInterval(id);
  }, [paused, count, ms]);
  const pause = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };
  return { active, setActive, pause };
}
