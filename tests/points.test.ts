import type { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import type { BookingStatus } from "@config/booking";
import { pointsRules } from "@config/points";
import { Booking } from "@/models/Booking";
import { PointsEntry } from "@/models/Ledger";
import { awardForCompletedBooking, pointsBalance, revokePoints } from "@/services/points";
import { makeClinic, makeUser } from "./helpers/factory";

type Ids = { clinic: { _id: Types.ObjectId }; doctor: { _id: Types.ObjectId } };

async function completed(patientId: Types.ObjectId, clinic: Ids, at: Date, status: BookingStatus = "completed") {
  return Booking.create({
    patientId,
    clinicId: clinic.clinic._id,
    doctorId: clinic.doctor._id,
    startUtc: at,
    endUtc: new Date(at.getTime() + 1800_000),
    status,
    holdsSlot: false,
    expiresAt: at,
    completedAt: at,
  });
}

describe("points ledger", () => {
  it("awards points once per completed booking", async () => {
    const c = await makeClinic();
    const p = await makeUser("patient");
    const b = await completed(p._id, c, new Date("2030-03-02T05:00:00Z"));
    expect(await awardForCompletedBooking(b._id, new Date("2030-03-02T06:00:00Z"))).toMatchObject({ awarded: true });
    expect(await awardForCompletedBooking(b._id, new Date("2030-03-02T06:00:00Z"))).toMatchObject({ awarded: false });
    expect(await pointsBalance(p._id)).toBe(pointsRules.perCompletedVisit);
  });

  it("gives nothing for pending, cancelled or no-show bookings", async () => {
    const c = await makeClinic();
    const p = await makeUser("patient");
    for (const status of ["pending", "cancelled_by_patient", "no_show"] as const) {
      const b = await completed(p._id, c, new Date("2030-03-02T05:00:00Z"), status);
      expect(await awardForCompletedBooking(b._id)).toMatchObject({ awarded: false, reason: "not_completed" });
    }
    expect(await pointsBalance(p._id)).toBe(0);
  });

  it("earns at most once per patient and clinic within 7 days", async () => {
    const c = await makeClinic();
    const p = await makeUser("patient");
    const b1 = await completed(p._id, c, new Date("2030-03-02T05:00:00Z"));
    const b2 = await completed(p._id, c, new Date("2030-03-05T05:00:00Z"));
    const b3 = await completed(p._id, c, new Date("2030-03-12T05:00:00Z"));
    expect((await awardForCompletedBooking(b1._id, new Date("2030-03-02T06:00:00Z"))).awarded).toBe(true);
    expect(await awardForCompletedBooking(b2._id, new Date("2030-03-05T06:00:00Z"))).toMatchObject({ awarded: false, reason: "pair_cooldown" });
    expect((await awardForCompletedBooking(b3._id, new Date("2030-03-12T06:00:00Z"))).awarded).toBe(true);
  });

  it("caps earning visits per calendar month", async () => {
    const p = await makeUser("patient");
    const day = (d: number) => new Date(Date.UTC(2030, 3, d, 5));
    for (let i = 0; i < pointsRules.maxEarningVisitsPerMonth; i++) {
      const c = await makeClinic();
      const b = await completed(p._id, c, day(i + 1));
      expect((await awardForCompletedBooking(b._id, day(i + 1))).awarded).toBe(true);
    }
    const extra = await makeClinic();
    const over = await completed(p._id, extra, day(20));
    expect(await awardForCompletedBooking(over._id, day(20))).toMatchObject({ awarded: false, reason: "monthly_cap" });

    const nextMonth = await completed(p._id, extra, new Date(Date.UTC(2030, 4, 2, 5)));
    expect((await awardForCompletedBooking(nextMonth._id, new Date(Date.UTC(2030, 4, 2, 6)))).awarded).toBe(true);
  });

  it("revocation appends a negative entry and never goes below zero", async () => {
    const c = await makeClinic();
    const p = await makeUser("patient");
    const admin = await makeUser("admin");
    const b = await completed(p._id, c, new Date("2030-03-02T05:00:00Z"));
    await awardForCompletedBooking(b._id, new Date("2030-03-02T06:00:00Z"));
    await revokePoints(String(admin._id), String(p._id), 4, "test");
    expect(await pointsBalance(p._id)).toBe(pointsRules.perCompletedVisit - 4);
    await revokePoints(String(admin._id), String(p._id), 1000, "test");
    expect(await pointsBalance(p._id)).toBe(0);
    expect(await PointsEntry.countDocuments({ userId: p._id })).toBe(3);
  });

  it("ledger entries cannot be edited or deleted", async () => {
    const p = await makeUser("patient");
    const e = await PointsEntry.create({ userId: p._id, delta: 10, reason: "visit_completed" });
    await expect(PointsEntry.updateOne({ _id: e._id }, { delta: 1000 })).rejects.toThrow(/immutable/);
    await expect(PointsEntry.deleteOne({ _id: e._id })).rejects.toThrow(/immutable/);
  });
});
