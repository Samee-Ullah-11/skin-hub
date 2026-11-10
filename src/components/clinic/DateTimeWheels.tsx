"use client";

import { Wheel } from "@/components/ui/Wheel";
import type { Lang } from "@/i18n/config";
import type { SlotView } from "./SlotGrid";

interface DayData {
  date: string; // YYYY-MM-DD, clinic-local
  slots: SlotView[];
}

export interface WheelLabels {
  wheelDay: string;
  wheelMonth: string;
  wheelYear: string;
  wheelHour: string;
  wheelMinute: string;
  wheelPeriod: string;
  openTimes: string;
  noSlots: string;
  timesShownIn: string;
  chooseDay: string;
  chooseTime: string;
}

const free = (s: SlotView) => s.state === "available";

function partsOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

/** "14:30" -> { period: "PM", hour: "2", minute: "30" } */
function clock(time: string) {
  const [h, m] = time.split(":").map(Number);
  return { period: h < 12 ? "AM" : "PM", hour: String(h % 12 === 0 ? 12 : h % 12), minute: String(m).padStart(2, "0") };
}

/**
 * iPhone-style pickers for booking: date wheels (day / month / year) and time wheels
 * (hour / minute / AM-PM). Only bookable combinations are offered: dates with free times,
 * and free times on the chosen date.
 */
export function DateTimeWheels({
  lang,
  days,
  dayIndex,
  selected,
  onPickDay,
  onPickSlot,
  labels,
}: {
  lang: Lang;
  days: DayData[];
  dayIndex: number;
  selected: string | undefined;
  onPickDay: (index: number) => void;
  onPickSlot: (startUtc: string) => void;
  labels: WheelLabels;
}) {
  const locale = lang === "ur" ? "ur-PK" : "en-PK";
  const openDays = days.map((d, index) => ({ ...d, index, ...partsOf(d.date) })).filter((d) => d.slots.some(free));
  if (!openDays.length) return <p className="text-muted">{labels.noSlots}</p>;

  const current = openDays.find((d) => d.index === dayIndex) ?? openDays[0];

  // ---- Date wheels: year -> month -> day, each limited to dates with free times.
  const years = [...new Set(openDays.map((d) => d.y))];
  const inYear = openDays.filter((d) => d.y === current.y);
  const months = [...new Set(inYear.map((d) => d.m))];
  const inMonth = inYear.filter((d) => d.m === current.m);
  const monthName = (m: number) => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(Date.UTC(2000, m - 1, 1));
  const weekday = (d: (typeof openDays)[number]) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(Date.UTC(d.y, d.m - 1, d.d));

  function pickYear(v: string) {
    const y = Number(v);
    const same = openDays.find((d) => d.y === y && d.m === current.m && d.d === current.d);
    onPickDay((same ?? openDays.find((d) => d.y === y) ?? current).index);
  }
  function pickMonth(v: string) {
    const m = Number(v);
    const inThat = inYear.filter((d) => d.m === m);
    const same = inThat.find((d) => d.d === current.d);
    // Keep the day number if possible, otherwise the closest one in that month.
    const closest = [...inThat].sort((a, b) => Math.abs(a.d - current.d) - Math.abs(b.d - current.d))[0];
    onPickDay((same ?? closest ?? current).index);
  }

  // ---- Time wheels: the hour wheel lists every hour with free times (10, 11, 12, 2 ...);
  // the minute wheel lists free minutes in that hour; AM/PM follows the hour, like on an iPhone.
  const slots = current.slots.filter(free).filter((s) => s.time);
  const withClock = slots
    .map((s) => ({ slot: s, time: s.time as string, ...clock(s.time as string) }))
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((c) => ({ ...c, hourKey: `${c.period}-${c.hour}` }));
  const chosen = withClock.find((c) => c.slot.startUtc === selected) ?? withClock[0];
  const hours = [...new Map(withClock.map((c) => [c.hourKey, c.hour])).entries()];
  const periods = [...new Set(withClock.map((c) => c.period))];
  const inHour = withClock.filter((c) => c.hourKey === chosen?.hourKey);

  function pickHour(key: string) {
    const inThat = withClock.filter((c) => c.hourKey === key);
    const match = inThat.find((c) => c.minute === chosen?.minute) ?? inThat[0];
    if (match) onPickSlot(match.slot.startUtc);
  }
  function pickMinute(m: string) {
    const match = inHour.find((c) => c.minute === m);
    if (match) onPickSlot(match.slot.startUtc);
  }
  function pickPeriod(p: string) {
    if (p === chosen?.period) return;
    const match = withClock.find((c) => c.period === p && c.hour === chosen?.hour) ?? withClock.find((c) => c.period === p);
    if (match) onPickSlot(match.slot.startUtc);
  }

  const freeCount = current.slots.filter(free).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold">{labels.chooseDay}</p>
          <p className="text-xs text-muted">{labels.openTimes.replace("{count}", String(freeCount))}</p>
        </div>
        <div className="grid grid-cols-[1.2fr_1fr_1.1fr] gap-1 rounded-2xl bg-soft p-2">
          <Wheel
            label={labels.wheelDay}
            value={String(current.index)}
            onChange={(v) => onPickDay(Number(v))}
            options={inMonth.map((d) => ({ value: String(d.index), label: `${weekday(d)} ${d.d}` }))}
          />
          <Wheel
            label={labels.wheelMonth}
            value={String(current.m)}
            onChange={pickMonth}
            options={months.map((m) => ({ value: String(m), label: monthName(m) }))}
          />
          <Wheel
            label={labels.wheelYear}
            value={String(current.y)}
            onChange={pickYear}
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">{labels.chooseTime}</p>
        {chosen ? (
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-soft p-2">
            <Wheel label={labels.wheelHour} value={chosen.hourKey} onChange={pickHour} options={hours.map(([key, h]) => ({ value: key, label: h }))} />
            <Wheel
              label={labels.wheelMinute}
              value={chosen.minute}
              onChange={pickMinute}
              options={inHour.map((c) => ({ value: c.minute, label: c.minute }))}
            />
            <Wheel label={labels.wheelPeriod} value={chosen.period} onChange={pickPeriod} options={periods.map((p) => ({ value: p, label: p }))} />
          </div>
        ) : (
          <p className="text-muted">{labels.noSlots}</p>
        )}
        <p className="text-sm text-muted">{labels.timesShownIn}</p>
      </div>
    </div>
  );
}
