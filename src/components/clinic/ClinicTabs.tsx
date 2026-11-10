"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export interface TabbedClinic {
  id: string;
  card: ReactNode;
  featured: boolean;
  likes: number;
  minPrice: number | null;
}

type Tab = "all" | "featured" | "saved" | "price";

/** Filter tabs over server-rendered clinic cards: all, featured, most saved, lowest price. */
export function ClinicTabs({
  clinics,
  labels,
}: {
  clinics: TabbedClinic[];
  labels: { all: string; featured: string; saved: string; price: string; empty: string };
}) {
  const [tab, setTab] = useState<Tab>("all");
  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: labels.all },
    { key: "featured", label: labels.featured },
    { key: "saved", label: labels.saved },
    { key: "price", label: labels.price },
  ];

  const shown =
    tab === "featured"
      ? clinics.filter((c) => c.featured)
      : tab === "saved"
        ? [...clinics].filter((c) => c.likes > 0).sort((a, b) => b.likes - a.likes)
        : tab === "price"
          ? [...clinics].filter((c) => c.minPrice !== null).sort((a, b) => (a.minPrice ?? 0) - (b.minPrice ?? 0))
          : clinics;

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? "bg-primary text-on-primary" : "bg-surface text-ink shadow-sm hover:text-primary"
            }`}
          >
            {tab === t.key ? <Icon name="check" size={16} /> : null}
            {t.label}
          </button>
        ))}
      </div>
      {shown.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.slice(0, 6).map((c) => (
            <li key={c.id} className="rise-in">
              {c.card}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-3xl bg-surface p-8 text-center text-muted">{labels.empty}</p>
      )}
    </div>
  );
}
