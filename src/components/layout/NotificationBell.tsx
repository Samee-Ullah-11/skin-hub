"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Lang } from "@/i18n/config";

interface Item {
  id: string;
  text: string;
  link: string;
  read: boolean;
  createdAt: string;
}

const POLL_MS = 30_000;

export function NotificationBell({
  lang,
  labels,
}: {
  lang: Lang;
  labels: { notifications: string; unread: string; noNotifications: string; markAllRead: string };
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?lang=${lang}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Item[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* network hiccup: the next poll retries */
    }
  }, [lang]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (timer) return;
      void load();
      timer = setInterval(() => void load(), POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST" });
    await load();
  }

  const label = unread > 0 ? `${labels.notifications}, ${labels.unread.replace("{count}", String(unread))}` : labels.notifications;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-soft"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="bell" size={20} />
        {unread > 0 ? (
          <span className="absolute -top-0.5 end-0.5 min-w-5 rounded-full bg-accent px-1 text-center text-xs font-bold leading-5 text-on-accent">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute end-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-surface p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="font-semibold">{labels.notifications}</p>
            {unread > 0 ? (
              <button type="button" className="text-sm text-primary underline" onClick={markAllRead}>
                {labels.markAllRead}
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">{labels.noNotifications}</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <a
                    href={n.link}
                    className={`block rounded-md px-2 py-2 text-sm hover:bg-soft ${n.read ? "text-muted" : "font-semibold text-ink"}`}
                  >
                    {n.text}
                    <span className="block text-xs font-normal text-muted">
                      {new Date(n.createdAt).toLocaleString(lang === "ur" ? "ur-PK" : "en-PK", { timeZone: "Asia/Karachi" })}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
