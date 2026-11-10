import { describe, expect, it } from "vitest";
import { computeSlots, isOpenAt, isValidSlotStart, zonedDateKey, zonedToUtc } from "@/services/schedule";
import { MONDAY_10AM_PKT, MONDAY_9AM_PKT, WEEKDAYS } from "./helpers/factory";

const doctor = { weekly: WEEKDAYS, blockedDates: [] as string[], slotMinutes: 30 };

describe("time zone helpers", () => {
  it("converts Pakistan wall-clock time to UTC (UTC+5)", () => {
    expect(zonedToUtc("2030-01-07", "10:00").toISOString()).toBe("2030-01-07T05:00:00.000Z");
    expect(zonedToUtc("2030-01-07", "00:00").toISOString()).toBe("2030-01-06T19:00:00.000Z");
  });

  it("uses the Pakistan calendar date, not the UTC date", () => {
    expect(zonedDateKey(new Date("2030-01-06T20:30:00Z"))).toBe("2030-01-07");
  });
});

describe("computeSlots", () => {
  it("builds slots from the weekly schedule and skips breaks", () => {
    const [monday] = computeSlots({ doctor, now: MONDAY_9AM_PKT, days: 1, holds: [] });
    expect(monday.date).toBe("2030-01-07");
    expect(monday.slots.map((s) => s.time)).toEqual(["10:00", "10:30", "11:00", "11:30", "12:30", "13:00", "13:30"]);
    expect(monday.slots[0].startUtc.toISOString()).toBe("2030-01-07T05:00:00.000Z");
    expect(monday.slots.every((s) => s.state === "available")).toBe(true);
  });

  it("returns no slots on days without a schedule (Sunday)", () => {
    const days = computeSlots({ doctor, now: MONDAY_9AM_PKT, days: 7, holds: [] });
    const sunday = days.find((d) => d.weekday === 0)!;
    expect(sunday.slots).toHaveLength(0);
  });

  it("returns no slots on blocked dates", () => {
    const days = computeSlots({ doctor: { ...doctor, blockedDates: ["2030-01-08"] }, now: MONDAY_9AM_PKT, days: 2, holds: [] });
    expect(days[1].blocked).toBe(true);
    expect(days[1].slots).toHaveLength(0);
  });

  it("marks past times unavailable", () => {
    const now = new Date("2030-01-07T06:10:00Z"); // 11:10 PKT
    const [monday] = computeSlots({ doctor, now, days: 1, holds: [] });
    const states = Object.fromEntries(monday.slots.map((s) => [s.time, s.state]));
    expect(states["10:00"]).toBe("unavailable");
    expect(states["11:00"]).toBe("unavailable");
    expect(states["11:30"]).toBe("available");
  });

  it("shows held slots as taken, or as mine for the patient holding them", () => {
    const holds = [
      { startUtc: MONDAY_10AM_PKT, patientId: "p1" },
      { startUtc: new Date("2030-01-07T05:30:00Z"), patientId: "p2" },
    ];
    const [monday] = computeSlots({ doctor, now: MONDAY_9AM_PKT, days: 1, holds, viewerId: "p1" });
    expect(monday.slots[0].state).toBe("mine");
    expect(monday.slots[1].state).toBe("taken");
    expect(monday.slots[2].state).toBe("available");
  });
});

describe("isValidSlotStart", () => {
  it("accepts real slot starts and rejects forged ones", () => {
    expect(isValidSlotStart(doctor, MONDAY_10AM_PKT)).toBe(true);
    expect(isValidSlotStart(doctor, new Date("2030-01-07T05:10:00Z"))).toBe(false);
    expect(isValidSlotStart(doctor, new Date("2030-01-07T07:00:00Z"))).toBe(false); // 12:00 is in the break
    expect(isValidSlotStart(doctor, new Date("2030-01-06T05:00:00Z"))).toBe(false); // Sunday
    expect(isValidSlotStart(doctor, new Date("2030-01-07T09:00:00Z"))).toBe(false); // 14:00 is closing time
  });
});

describe("isOpenAt", () => {
  it("is open inside hours and closed in breaks or on blocked days", () => {
    expect(isOpenAt(doctor, new Date("2030-01-07T05:15:00Z"))).toBe(true);
    expect(isOpenAt(doctor, new Date("2030-01-07T07:10:00Z"))).toBe(false);
    expect(isOpenAt({ ...doctor, blockedDates: ["2030-01-07"] }, new Date("2030-01-07T05:15:00Z"))).toBe(false);
  });
});
