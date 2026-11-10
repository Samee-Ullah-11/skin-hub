import type { DoctorDoc, TimeRange } from "@/models/Doctor";

export const TIME_ZONE = "Asia/Karachi";

const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** "YYYY-MM-DD" for the given instant in Pakistan time. */
export function zonedDateKey(d: Date): string {
  return dateFmt.format(d);
}

function offsetMinutes(at: Date): number {
  const p = Object.fromEntries(partsFmt.formatToParts(at).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** The UTC instant for a wall-clock time in Pakistan on the given date. */
export function zonedToUtc(dateKey: string, hhmm: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  return new Date(guess.getTime() - offsetMinutes(guess) * 60000);
}

export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a calendar date. */
export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function zonedMinutes(d: Date): number {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return +p.hour * 60 + +p.minute;
}

function overlapsBreak(start: number, end: number, breaks: TimeRange[]): boolean {
  return breaks.some((b) => start < toMinutes(b.end) && end > toMinutes(b.start));
}

type ScheduleSource = Pick<DoctorDoc, "weekly" | "blockedDates">;

export function isOpenAt(doctor: ScheduleSource, at: Date): boolean {
  const key = zonedDateKey(at);
  if (doctor.blockedDates.includes(key)) return false;
  const day = doctor.weekly.find((w) => w.weekday === weekdayOf(key));
  if (!day) return false;
  const now = zonedMinutes(at);
  return now >= toMinutes(day.start) && now < toMinutes(day.end) && !overlapsBreak(now, now + 1, day.breaks);
}

export type SlotState = "available" | "taken" | "mine" | "unavailable";

export interface ComputedSlot {
  startUtc: Date;
  endUtc: Date;
  time: string;
  state: SlotState;
}

export interface ComputedDay {
  date: string;
  weekday: number;
  blocked: boolean;
  slots: ComputedSlot[];
}

export interface SlotHold {
  startUtc: Date;
  patientId: string;
}

/**
 * Builds the bookable slots for one doctor from the weekly schedule, minus breaks, blocked dates, past times
 * and slots held by active (pending or confirmed) bookings. Nothing is stored; this runs on every request.
 */
export function computeSlots(args: {
  doctor: ScheduleSource & Pick<DoctorDoc, "slotMinutes">;
  now: Date;
  days: number;
  holds: SlotHold[];
  viewerId?: string;
}): ComputedDay[] {
  const { doctor, now, days, holds, viewerId } = args;
  const held = new Map(holds.map((h) => [h.startUtc.getTime(), h.patientId]));
  const today = zonedDateKey(now);
  const out: ComputedDay[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const weekday = weekdayOf(date);
    const blocked = doctor.blockedDates.includes(date);
    const day = doctor.weekly.find((w) => w.weekday === weekday);
    const slots: ComputedSlot[] = [];

    if (day && !blocked) {
      const open = toMinutes(day.start);
      const close = toMinutes(day.end);
      for (let s = open; s + doctor.slotMinutes <= close; s += doctor.slotMinutes) {
        const e = s + doctor.slotMinutes;
        if (overlapsBreak(s, e, day.breaks)) continue;
        const time = fromMinutes(s);
        const startUtc = zonedToUtc(date, time);
        const endUtc = new Date(startUtc.getTime() + doctor.slotMinutes * 60000);
        const holder = held.get(startUtc.getTime());
        let state: SlotState = "available";
        if (startUtc <= now) state = "unavailable";
        else if (holder !== undefined) state = holder === viewerId ? "mine" : "taken";
        slots.push({ startUtc, endUtc, time, state });
      }
    }
    out.push({ date, weekday, blocked, slots });
  }
  return out;
}

/** True when startUtc lines up with a real slot of this doctor's schedule. Used to reject forged slot times. */
export function isValidSlotStart(doctor: ScheduleSource & Pick<DoctorDoc, "slotMinutes">, startUtc: Date): boolean {
  const date = zonedDateKey(startUtc);
  if (doctor.blockedDates.includes(date)) return false;
  const day = doctor.weekly.find((w) => w.weekday === weekdayOf(date));
  if (!day) return false;
  const s = zonedMinutes(startUtc);
  const open = toMinutes(day.start);
  const e = s + doctor.slotMinutes;
  if (s < open || e > toMinutes(day.end) || (s - open) % doctor.slotMinutes !== 0) return false;
  if (startUtc.getUTCSeconds() !== 0 || startUtc.getUTCMilliseconds() !== 0) return false;
  return !overlapsBreak(s, e, day.breaks);
}

export function clinicHours(doctors: ScheduleSource[]): { weekday: number; start: string; end: string }[] {
  const out: { weekday: number; start: string; end: string }[] = [];
  for (let w = 0; w < 7; w++) {
    const days = doctors.flatMap((d) => d.weekly.filter((x) => x.weekday === w));
    if (!days.length) continue;
    const start = Math.min(...days.map((d) => toMinutes(d.start)));
    const end = Math.max(...days.map((d) => toMinutes(d.end)));
    out.push({ weekday: w, start: fromMinutes(start), end: fromMinutes(end) });
  }
  return out;
}
