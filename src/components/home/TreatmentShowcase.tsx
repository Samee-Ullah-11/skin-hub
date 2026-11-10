"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useCycle } from "./useCycle";

export interface ShowcaseItem {
  slug: string;
  name: string;
  label: string;
  href: string;
  image: string;
  icon: IconName;
}

/**
 * A row of small treatment cards; the hovered (or tapped, on touch) one fills the panel behind
 * with its photo and name, and the selection moves on by itself every few seconds.
 * On touch devices the first tap selects, the second opens the link.
 */
export function TreatmentShowcase({ items, title, titleId, action }: { items: ShowcaseItem[]; title: string; titleId: string; action: ReactNode }) {
  const { active, setActive, pause } = useCycle(items.length, 2500);
  const current = items[active];
  if (!current) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0b1218] text-white" {...pause}>
      {items.map((it, i) => (
        <Image
          key={it.slug}
          src={it.image}
          alt=""
          fill
          sizes="100vw"
          priority={i === 0}
          className={`object-cover blur-sm transition-opacity duration-500 ease-out ${i === active ? "opacity-100" : "opacity-0"}`}
          style={{ transform: "scale(1.1)" }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" aria-hidden="true" />

      <div className="relative flex min-h-[32rem] flex-col justify-between gap-10 p-5 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id={titleId} className="text-xl text-white sm:text-2xl">
              {title}
            </h2>
            {action}
          </div>
          <p key={`t-${current.slug}`} className="fade-in text-[clamp(2.5rem,9vw,7rem)] font-bold leading-none tracking-tight text-white/90" aria-hidden="true">
            {current.name}
          </p>
        </div>

        <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 py-3 sm:mx-0 sm:justify-center sm:px-0" style={{ scrollbarWidth: "none" }}>
          {items.map((it, i) => {
            const isActive = i === active;
            return (
              <li key={it.slug} className="shrink-0 snap-center">
                <Link
                  href={it.href}
                  aria-current={isActive ? "true" : undefined}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={(e) => {
                    // Touch screens have no hover: the first tap previews, the second opens.
                    if (!isActive && !window.matchMedia("(hover: hover)").matches) {
                      e.preventDefault();
                      setActive(i);
                    }
                  }}
                  className={`relative block h-28 w-28 overflow-hidden rounded-2xl bg-surface shadow-lg transition-[transform,box-shadow] duration-300 ease-out sm:h-32 sm:w-32 ${
                    isActive ? "scale-110 ring-2 ring-white" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <Image src={it.image} alt="" fill sizes="128px" className="object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6 text-xs font-semibold leading-tight text-white">
                    <Icon name={it.icon} size={14} className="mb-1" />
                    <span className="block">{it.name}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p key={`l-${current.slug}`} className="fade-in self-end text-end text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
          {current.label}
        </p>
      </div>
    </div>
  );
}
