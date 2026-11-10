"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const KEY = "sh-announcement-hidden";

/** Thin bar above the navbar that rotates short messages; can be hidden for the session. */
export function AnnouncementBar({ messages, hideLabel }: { messages: readonly string[]; hideLabel: string }) {
  const [index, setIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) document.documentElement.dataset.announcement = "hidden";
    } catch {}
    if (messages.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => window.clearInterval(id);
  }, [messages.length]);

  if (hidden) return null;
  return (
    <div className="announcement relative z-50 bg-primary text-on-primary">
      <div className="container-page flex h-9 items-center justify-center text-center text-xs font-medium sm:text-sm">
        <p key={index} className="rise-in truncate px-8" aria-live="polite">
          {messages[index]}
        </p>
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            document.documentElement.dataset.announcement = "hidden";
            try {
              sessionStorage.setItem(KEY, "1");
            } catch {}
          }}
          aria-label={hideLabel}
          className="absolute end-3 flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/15"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  );
}
