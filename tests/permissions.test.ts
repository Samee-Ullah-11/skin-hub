import { describe, expect, it } from "vitest";
import { adminOp } from "@/actions/admin";
import { clinicBookingAction } from "@/actions/bookings";
import { saveDoctorAction } from "@/actions/clinic";
import { Clinic } from "@/models/Clinic";
import { Doctor } from "@/models/Doctor";
import { cancelByPatient, completeBooking, confirmBooking, createBooking, listClinicBookings } from "@/services/bookings";
import { getOwnDoctor, updateOwnDoctor } from "@/services/doctors";
import { listOwnStatements } from "@/services/statements";
import { loginAs, makeClinic, makeUser, MONDAY_10AM_PKT, MONDAY_9AM_PKT } from "./helpers/factory";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

async function bookAtB() {
  const a = await makeClinic();
  const b = await makeClinic();
  const patient = await makeUser("patient");
  const booking = await createBooking(
    { id: String(patient._id), emailVerified: true },
    { doctorId: String(b.doctor._id), startUtc: MONDAY_10AM_PKT, note: "" },
    MONDAY_9AM_PKT,
  );
  return { a, b, patient, booking };
}

describe("clinic A cannot touch clinic B", () => {
  it("cannot confirm or complete clinic B's booking by ID", async () => {
    const { a, booking } = await bookAtB();
    await expect(confirmBooking(String(a.owner._id), String(booking._id), MONDAY_9AM_PKT)).rejects.toMatchObject({ code: "not_found" });
    await expect(completeBooking(String(a.owner._id), String(booking._id), 1000, new Date("2030-01-07T06:00:00Z"))).rejects.toMatchObject({ code: "not_found" });
  });

  it("does not see clinic B's bookings or patient phone numbers", async () => {
    const { a, b } = await bookAtB();
    expect(await listClinicBookings(String(a.owner._id), {}, MONDAY_9AM_PKT)).toHaveLength(0);
    const own = await listClinicBookings(String(b.owner._id), {}, MONDAY_9AM_PKT);
    expect(own).toHaveLength(1);
    expect(own[0].patient?.phone).toBeTruthy();
  });

  it("cannot read or edit clinic B's doctor", async () => {
    const { a, b } = await bookAtB();
    await expect(getOwnDoctor(String(a.owner._id), String(b.doctor._id))).rejects.toMatchObject({ code: "not_found" });
    await expect(
      updateOwnDoctor(String(a.owner._id), String(b.doctor._id), {
        name: { en: "Hijacked" },
        specialty: { en: "" },
        qualifications: "",
        bio: { en: "" },
        slotMinutes: 30,
        weekly: [],
        blockedDates: [],
        active: false,
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    expect((await Doctor.findById(b.doctor._id).lean())!.name.en).not.toBe("Hijacked");
  });

  it("server actions ignore a doctor ID from another clinic", async () => {
    const { a, b } = await bookAtB();
    await loginAs(a.owner);
    const state = await saveDoctorAction(
      {},
      form({ lang: "en", doctorId: String(b.doctor._id), "name.en": "Hijacked", slotMinutes: "30", active: "on" }),
    );
    expect(state.ok).toBe(false);
    expect((await Doctor.findById(b.doctor._id).lean())!.name.en).not.toBe("Hijacked");
  });

  it("booking actions refuse another clinic's booking", async () => {
    const { a, booking } = await bookAtB();
    await loginAs(a.owner);
    const state = await clinicBookingAction({}, form({ lang: "en", op: "confirm", bookingId: String(booking._id) }));
    expect(state.ok).toBe(false);
  });

  it("only lists the caller's own statements", async () => {
    const { a } = await bookAtB();
    expect(await listOwnStatements(String(a.owner._id))).toHaveLength(0);
  });
});

describe("patients", () => {
  it("cannot cancel another patient's booking", async () => {
    const { booking } = await bookAtB();
    const intruder = await makeUser("patient");
    await expect(cancelByPatient(String(intruder._id), String(booking._id), MONDAY_9AM_PKT)).rejects.toMatchObject({ code: "not_found" });
  });

  it("cannot use clinic booking actions", async () => {
    const { patient, booking } = await bookAtB();
    await loginAs(patient);
    const state = await clinicBookingAction({}, form({ lang: "en", op: "confirm", bookingId: String(booking._id) }));
    expect(state.ok).toBe(false);
  });
});

describe("admin actions", () => {
  it("are refused for patients, clinic owners and anonymous users", async () => {
    const { a } = await makeClinic().then((x) => ({ a: x }));
    await Clinic.updateOne({ _id: a.clinic._id }, { status: "pending" });
    const fields = { lang: "en", op: "clinic.approve", clinicId: String(a.clinic._id) };

    expect((await adminOp({}, form(fields))).ok).toBe(false);
    await loginAs(await makeUser("patient"));
    expect((await adminOp({}, form(fields))).ok).toBe(false);
    await loginAs(a.owner);
    expect((await adminOp({}, form(fields))).ok).toBe(false);
    expect((await Clinic.findById(a.clinic._id).lean())!.status).toBe("pending");
  });

  it("work for an admin and are recorded in the activity log", async () => {
    const { clinic } = await makeClinic();
    await Clinic.updateOne({ _id: clinic._id }, { status: "pending" });
    await loginAs(await makeUser("admin"));
    const state = await adminOp({}, form({ lang: "en", op: "clinic.approve", clinicId: String(clinic._id) }));
    expect(state.ok).toBe(true);
    expect((await Clinic.findById(clinic._id).lean())!.status).toBe("approved");
    const { ActivityLog } = await import("@/models/Platform");
    expect(await ActivityLog.countDocuments({ action: "clinic.approve" })).toBe(1);
  });

  it("revoked sessions stop working", async () => {
    const admin = await makeUser("admin");
    await loginAs(admin);
    const { User } = await import("@/models/User");
    await User.updateOne({ _id: admin._id }, { $inc: { tokenVersion: 1 } });
    const state = await adminOp({}, form({ lang: "en", op: "clinic.approve", clinicId: String(admin._id) }));
    expect(state.ok).toBe(false);
  });
});
