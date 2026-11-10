import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@config/site";
import { fmt, type Lang } from "@/i18n/config";
import { pages } from "@/i18n/dict/pages";
import { pageMeta } from "@/lib/seo";

export type InfoKey = keyof (typeof pages)["en"];

const PATHS: Record<InfoKey, string> = {
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  disclaimer: "/medical-disclaimer",
};

export function infoMeta(lang: Lang, key: InfoKey): Metadata {
  const p = pages[lang][key];
  return pageMeta(lang, PATHS[key], fmt(p.title, { site: site.name }), fmt(p.description, { site: site.name }));
}

export function InfoPage({ lang, page, children }: { lang: Lang; page: InfoKey; children?: ReactNode }) {
  const p = pages[lang][page];
  const s = (x: string) => fmt(x, { site: site.name });
  return (
    <article className="container-page max-w-3xl py-10 md:py-14">
      <h1 className="mb-6 text-3xl md:text-4xl">{s(p.title)}</h1>
      <div className="flex flex-col gap-6 text-[17px]">
        {p.blocks.map((b, i) => (
          <section key={i} className="flex flex-col gap-3">
            {b.h ? <h2 className="text-xl">{s(b.h)}</h2> : null}
            {b.p.map((para) => (
              <p key={para}>{s(para)}</p>
            ))}
          </section>
        ))}
        {children}
      </div>
    </article>
  );
}
