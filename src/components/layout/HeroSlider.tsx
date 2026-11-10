"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export interface HeroSlide {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  art: string;
  /** Short line for the floating spotlight card, built from live clinic data. */
  spotlight: string;
}

const DURATION = 6500;

/**
 * Full-screen hero slideshow: artwork cross-fades with a slow zoom, text rises in per slide.
 * Autoplays (paused on hover/focus, off for reduced motion), with arrows, dots and a counter.
 */
export function HeroSlider({
  slides,
  secondary,
  trust,
  labels,
  greeting,
}: {
  greeting?: string;
  slides: HeroSlide[];
  secondary: ReactNode;
  trust: string;
  labels: { prev: string; next: string; goTo: string; spotlight: string };
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = slides.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    mq.addEventListener("change", update);
    const id = window.setTimeout(update, 0);
    return () => {
      mq.removeEventListener("change", update);
      window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (paused || reduced || count < 2) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), DURATION);
    return () => window.clearTimeout(id);
  }, [index, paused, reduced, count]);

  const slide = slides[index];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section
      aria-roledescription="carousel"
      aria-labelledby="hero-title"
      className="relative -mt-20 flex flex-col overflow-hidden bg-[#08121a] pt-20 text-white"
      style={{ minHeight: "calc(100svh - var(--announce-h))" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Artwork layers */}
      {slides.map((s, i) => (
        <div
          key={s.art}
          aria-hidden="true"
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={s.art}
            alt=""
            fill
            priority={i === 0}
            unoptimized
            className={`object-cover ${i === index && !reduced ? "hero-zoom" : ""}`}
          />
        </div>
      ))}
      {/* Readability: dark on the text side, clear on the art side. */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08121a]/95 via-[#08121a]/70 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08121a]/80 to-transparent" aria-hidden="true" />

      <div className="container-page relative grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.15fr_1fr]">
        <div key={index} className="flex max-w-2xl flex-col items-start gap-5" aria-live={paused ? "polite" : "off"}>
          {greeting ? <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90">{greeting}</span> : null}
          <span className="rise-in text-xs font-semibold uppercase tracking-[0.2em] text-[#7fd6ff]">{slide.eyebrow}</span>
          <h1 id="hero-title" className="text-[clamp(2.1rem,min(5.4vw,7.5svh),4rem)] text-white">
            {slide.title.split(" ").map((word, i) => (
              <span key={i} className="rise-in inline-block" style={{ animationDelay: `${60 + i * 45}ms` }}>
                {word}&nbsp;
              </span>
            ))}
          </h1>
          <p className="rise-in delay-2 max-w-xl text-[clamp(1rem,2.2svh,1.15rem)] text-white/80">{slide.body}</p>
          <div className="rise-in delay-3 flex flex-wrap gap-3">
            <Link
              href={slide.href}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-[#08121a] transition-transform hover:-translate-y-0.5"
            >
              {slide.cta}
              <Icon name="arrowRight" size={18} />
            </Link>
            {secondary}
          </div>
          <p className="rise-in delay-4 text-sm text-white/60">{trust}</p>
        </div>

        <aside
          key={`card-${index}`}
          className="rise-in delay-3 hidden max-w-xs justify-self-end rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md lg:block"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7fd6ff]">{labels.spotlight}</p>
          <p className="mt-2 text-lg font-semibold">{slide.eyebrow}</p>
          <p className="mt-1 text-sm text-white/75">{slide.spotlight}</p>
        </aside>
      </div>

      {/* Controls */}
      <div className="container-page relative flex items-center justify-between gap-4 pb-28 md:justify-end lg:pb-6">
        <p className="text-sm tabular-nums text-white/70">
          <span className="font-semibold text-white">{pad(index + 1)}</span> / {pad(count)}
        </p>
        <div className="flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.art}
              type="button"
              onClick={() => go(i)}
              aria-label={labels.goTo.replace("{n}", String(i + 1)).replace("{title}", s.eyebrow)}
              aria-current={i === index ? "true" : undefined}
              className={`relative h-1.5 overflow-hidden rounded-full bg-white/25 transition-[width,background-color] duration-200 ${i === index ? "w-10" : "w-4 hover:bg-white/40"}`}
            >
              {i === index ? (
                <span
                  key={`${index}-${paused}`}
                  className={`absolute inset-y-0 start-0 rounded-full bg-white ${paused || reduced ? "w-full" : "hero-progress"}`}
                  style={{ animationDuration: `${DURATION}ms` }}
                />
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={labels.prev}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 hover:bg-white/10"
          >
            <Icon name="arrowRight" size={18} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label={labels.next}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#08121a] hover:-translate-y-0.5"
          >
            <Icon name="arrowRight" size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
