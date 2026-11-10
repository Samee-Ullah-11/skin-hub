"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export interface GalleryItem {
  src?: string;
  alt: string;
  /** Show the placeholder label as a chip over the image (sample art). */
  sample?: boolean;
}

/** Photo grid with a full-screen viewer. Items without a src render as labelled placeholders. */
export function Gallery({ items, closeLabel, placeholderLabel }: { items: GalleryItem[]; closeLabel: string; placeholderLabel: string }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  const tile = (item: GalleryItem, big: boolean) =>
    item.src ? (
      <>
        <Image src={item.src} alt={item.alt} fill sizes={big ? "(min-width: 768px) 50vw, 100vw" : "25vw"} unoptimized className="object-cover transition-transform duration-300 ease-out group-hover:scale-105" />
        {item.sample ? (
          <span className="absolute start-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-semibold text-ink">{placeholderLabel}</span>
        ) : null}
      </>
    ) : (
      <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-chip to-soft text-primary/60">
        <Icon name="image" size={big ? 40 : 28} />
        <span className="text-xs font-semibold">{placeholderLabel}</span>
      </span>
    );

  return (
    <>
      <ul className="grid auto-rows-[8rem] grid-cols-2 gap-3 md:auto-rows-[10rem] md:grid-cols-4">
        {items.map((item, i) => (
          <li key={i} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={item.alt}
              className="group relative block h-full w-full overflow-hidden rounded-2xl"
            >
              {tile(item, i === 0)}
            </button>
          </li>
        ))}
      </ul>
      {open !== null ? (
        <div role="dialog" aria-modal="true" aria-label={items[open].alt} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setOpen(null)}>
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label={closeLabel}
            autoFocus
          >
            <Icon name="x" size={22} />
          </button>
          <div className="relative aspect-[4/3] w-full max-w-4xl overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
            {tile(items[open], true)}
          </div>
        </div>
      ) : null}
    </>
  );
}
