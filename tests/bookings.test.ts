import { describe, expect, it } from "vitest";
import { Booking } from "@/models/Booking";
import {
  cancelByPatient,
  confirmBooking,
  createBooking,
  declineBooking,
  expireStale,
  listPatientBookings,
  slotsForDoctor,
} from "@/services/bookings";
import { makeClinic, makeUser, MONDAY_10AM_PKT, MONDAY_9AM_PKT, setSettings } from "./helpers/factory";

const patientOf = (u: { _id: unknown }) => ({ id: String(u._id), emailVerified: true });

describe("atomic double-booking prevention", () => {
  it("lets exactly one of two simultaneous requests win the same slot", async () => {
    const { doctor } = await makeClinic();
    const [a, b] = await Promise.all([makeUser("patient"), makeUser("patient")]);
    const input = { doctorId: String(doctor._id), startUtc: MONDAY_10AM_PKT, note: "" };

    const results = await Promise.allSettled([
      createBooking(patientOf(a), input, MONDAY_9AM_PKT),
      createBooking(patientOf(b), input, MONDAY_9AM_PKT),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].reason.code).toBe("slot_taken");
    expect(await Booking.countDocuments({ holdsSlot: true })).toBe(1);
  });

  it("frees the slot after decline and after cancellation", async () => {
    const { owner, doctor } = await makeClinic();
    const p1 = await makeUser("patient");
    const p2 = await makeUser("patient");
    const input = { doctorId: String(doctor._id), startUtc: MONDAY_10AM_PKT, note: "" };

    const first = await createBooking(patientOf(p1), input, MONDAY_9AM_PKT);
    await declineBooking(String(owner._id), String(first._id), MONDAY_9AM_PKT);
    const second = await createBooking(patientOf(p2), input, MONDAY_9AM_PKT);
    await cancelByPatient(String(p2._id), String(second._id), MONDAY_9AM_PKT);
    await expect(createBooking(patientOf(p1), input, MONDAY_9AM_PKT)).resolves.toBeTruthy();
  });

  it("rejects forged, past and unverified requests", async () => {
    const { doctor } = await makeClinic();
    const p = await makeUser("patient");
    const doctorId = String(doctor._id);
    await expect(createBooking(patientOf(p), { doctorId, startUtc: new Date("2030-01-07T05:07:00Z"), note: "" }, MONDAY_9AM_PKT)).rejects.toMatchObject({ code: "slot_taken" });
    await expect(createBooking(patientOf(p), { doctorId, startUtc: MONDAY_10AM_PKT, note: "" }, new Date("2030-01-07T06:00:00Z"))).rejects.toMatchObject({ code: "slot_taken" });
    await expect(createBooking({ id: String(p._id), emailVerified: false }, { doctorId, startUtc: MONDAY_10AM_PKT, note: "" }, MONDAY_9AM_PKT)).rejects.toMatchObject({ code: "email_unverified" });
  });

  it("refuses bookings at clinics that are not approved", async () => {
    const { doctor } = await makeClinic({ status: "pending" });
    const p = await makeUser("patient");
    await expect(createBooking(patientOf(p), { doctorId: String(doctor._id), startUtc: MONDAY_10AM_PKT, note: "" }, MONDAY_9AM_PKT)).rejects.toMatchObject({ code: "not_found" });
  });

  it("limits a patient to 3 active pending requests", async () => {
    const { doctor } = await makeClinic();
    const p = await makeUser("patient");
    const doctorId = String(doctor._id);
    for (const minute of [0, 30, 60]) {
      await createBooking(patientOf(p), { doctorId, startUtc: new Date(MONDAY_10AM_PKT.getTime() + minute * 60000), note: "" }, MONDAY_9AM_PKT);
    }
    await expect(
      createBooking(patientOf(p), { doctorId, startUtc: new Date(MONDAY_10AM_PKT.getTime() + 90 * 60000), note: "" }, MONDAY_9AM_PKT),
    ).rejects.toMatchObject({ code: "too_many_pending" });
  });
});

describe("lazy expiry", () => {
  it("expires unanswered requests on the next read and releases the slot", async () => {
    await setSettings({ pendingExpiryHours: 2 });
    const { owner, doctor } = await makeClinic();
    const p = await makeUser("patient");
    const other = await makeUser("patient");
    const booking = await createBooking(patientOf(p), { doctorId: String(doctor._id), startUtc: new Date("2030-01-08T05:00:00Z"), note: "" }, MONDAY_9AM_PKT);
    expect(booking.expiresAt.toISOString()).toBe("2030-01-07T06:00:00.000Z");

    const later = new Date("2030-01-07T06:30:00Z");
    const list = await listPatientBookings(String(p._id), later);
    expect(list[0].status).toBe("expired");
    expect(list[0].holdsSlot).toBe(false);

    await expect(confirmBooking(String(owner._id), String(booking._id), later)).rejects.toMatchObject({ code: "invalid_state" });
    await expect(createBooking(patientOf(other), { doctorId: String(doctor._id), startUtc: new Date("2030-01-08T05:00:00Z"), note: "" }, later)).resolves.toBeTruthy();
  });

  it("never lets a request outlive its own start time", async () => {
    await setSettings({ pendingExpiryHours: 12 });
    const { doctor } = await makeClinic();
    const p = await makeUser("patient");
    const b = await createBooking(patientOf(p), { doctorId: String(doctor._id), startUtc: MONDAY_10AM_PKT, note: "" }, MONDAY_9AM_PKT);
    expect(b.expiresAt.getTime()).toBe(MONDAY_10AM_PKT.getTime());
  });

  it("expires before computing slots", async () => {
    await setSettings({ pendingExpiryHours: 1 });
    const { doctor } = await makeClinic();
    const p = await makeUser("patient");
    const start = new Date("2030-01-08T05:00:00Z");
    await createBooking(patientOf(p), { doctorId: String(doctor._id), startUtc: start, note: "" }, MONDAY_9AM_PKT);
    const days = await slotsForDoctor(String(doctor._id), undefined, new Date("2030-01-07T06:00:00Z"));
    const slot = days.flatMap((d) => d.slots).find((s) => s.startUtc.getTime() === start.getTime());
    expect(slot?.state).toBe("available");
    expect(await expireStale({}, new Date("2030-01-07T06:00:00Z"))).toBe(0);
  });
});

describe("treatments on a booking", () => {
  it("keeps the clinic's own treatments, drops others and duplicates, and lists them", async () => {
    const { Treatment } = await import("@/models/Catalog");
    const { Clinic } = await import("@/models/Clinic");
    const { clinic, doctor } = await makeClinic();
    const [t1, t2, foreign] = await Treatment.create([
      { categoryId: clinic.categoryId, name: { en: "Peel" }, slug: `peel-${String(clinic._id)}`, active: true },
      { categoryId: clinic.categoryId, name: { en: "Facial" }, slug: `facial-${String(clinic._id)}`, active: true },
      { categoryId: clinic.categoryId, name: { en: "Other" }, slug: `other-${String(clinic._id)}`, active: true },
    ]);
    await Clinic.updateOne({ _id: clinic._id }, { $set: { treatments: [{ treatmentId: t1._id }, { treatmentId: t2._id }] } });
    const p = await makeUser("patient");
    await createBooking(
      patientOf(p),
      {
        doctorId: String(doctor._id),
        startUtc: MONDAY_10AM_PKT,
        note: "",
        treatmentIds: [String(t1._id), String(foreign._id), String(t2._id), String(t1._id)],
      },
      MONDAY_9AM_PKT,
    );
    const [mine] = await listPatientBookings(String(p._id), MONDAY_9AM_PKT);
    expect(mine.treatments.map((x) => x.en).sort()).toEqual(["Facial", "Peel"]);
  });
});
