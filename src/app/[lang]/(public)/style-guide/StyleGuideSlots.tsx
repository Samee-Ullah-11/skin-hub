"use client";

import { useState } from "react";
import { SlotGrid, type SlotView } from "@/components/clinic/SlotGrid";

const DEMO: SlotView[] = [
  { startUtc: "a", label: "10:00", state: "available" },
  { startUtc: "b", label: "10:30", state: "taken" },
  { startUtc: "c", label: "11:00", state: "available" },
  { startUtc: "d", label: "11:30", state: "mine" },
  { startUtc: "e", label: "12:00", state: "taken" },
  { startUtc: "f", label: "12:30", state: "unavailable" },
  { startUtc: "g", label: "14:00", state: "available" },
  { startUtc: "h", label: "14:30", state: "available" },
  { startUtc: "i", label: "15:00", state: "taken" },
  { startUtc: "j", label: "15:30", state: "available" },
];

export function StyleGuideSlots({
  labels,
}: {
  labels: { available: string; booked: string; yourRequest: string; unavailable: string; slotLabel: string; timesShownIn: string };
}) {
  const [selected, setSelected] = useState<string>();
  return (
    <div className="flex flex-col gap-3">
      <SlotGrid slots={DEMO} selected={selected} onSelect={setSelected} labels={labels} />
      <p className="text-sm text-muted">{labels.timesShownIn}</p>
    </div>
  );
}
