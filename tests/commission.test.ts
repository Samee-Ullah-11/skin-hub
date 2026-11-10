import { describe, expect, it } from "vitest";
import { Clinic } from "@/models/Clinic";
import { CommissionEntry, Statement } from "@/models/Ledger";
import { completeBooking, confirmBooking, createBooking } from "@/services/bookings";
import { computeCommission, periodOf } from "@/services/commission";
import { generateStatements, markStatementPaid } from "@/services/statements";
import { makeClinic, makeUser, MONDAY_10AM_PKT, MONDAY_9AM_PKT, setSettings } from "./helpers/factory";

describe("computeCommission", () => {
  it("takes a percentage of the fee in percent mode", () => {
    expect(computeCommission(3000, "percent", 10)).toBe(300);
    expect(computeCommission(2500, "percent", 7.5)).toBe(188);
    expect(computeCommission(0, "percent", 10)).toBe(0);
  });

  it("charges a flat amount in fixed mode regardless of fee", () => {
    expect(computeCommission(3000, "fixed", 200)).toBe(200);
    expect(computeCommission(0, "fixed", 200)).toBe(200);
  });

  it("uses the Pakistan calendar month for the period", () => {
    expect(periodOf(new Date("2030-01-31T20:00:00Z"))).toBe("2030-02");
  });
});

async function completedVisit(fee: number) {
  const c = await makeClinic();
  const p = await makeUser("patient");
  const b = await createBooking({ id: String(p._id), emailVerified: true }, { doctorId: String(c.doctor._id), startUtc: MONDAY_10AM_PKT, note: "" }, MONDAY_9AM_PKT);
  await confirmBooking(String(c.owner._id), String(b._id), MONDAY_9AM_PKT);
  return { c, complete: () => completeBooking(String(c.owner._id), String(b._id), fee, new Date("2030-01-07T06:00:00Z")) };
}

describe("commission ledger and statements", () => {
  it("records commission when a visit is completed, using the platform rate", async () => {
    await setSettings({ commissionMode: "percent", commissionRate: 10 });
    const { c, complete } = await completedVisit(4000);
    await complete();
    const entry = await CommissionEntry.findOne({ clinicId: c.clinic._id }).lean();
    expect(entry).toMatchObject({ visitFeePkr: 4000, amountPkr: 400, period: "2030-01", mode: "percent" });
  });

  it("applies a per-clinic override", async () => {
    await setSettings({ commissionMode: "percent", commissionRate: 10 });
    const { c, complete } = await completedVisit(4000);
    await Clinic.updateOne({ _id: c.clinic._id }, { commissionOverride: { mode: "fixed", rate: 250 } });
    await complete();
    expect((await CommissionEntry.findOne({ clinicId: c.clinic._id }).lean())!.amountPkr).toBe(250);
  });

  it("builds monthly statements and keeps paid ones unchanged", async () => {
    await setSettings({ commissionMode: "percent", commissionRate: 10 });
    const admin = await makeUser("admin");
    const { c, complete } = await completedVisit(5000);
    await complete();
    expect(await generateStatements(String(admin._id), "2030-01")).toBe(1);
    const st = await Statement.findOne({ clinicId: c.clinic._id }).lean();
    expect(st).toMatchObject({ bookingCount: 1, totalFeesPkr: 5000, commissionDuePkr: 500, status: "unpaid" });

    await markStatementPaid(String(admin._id), String(st!._id), "Bank ref 123");
    await CommissionEntry.updateOne({ clinicId: c.clinic._id }, { amountPkr: 9999 });
    await generateStatements(String(admin._id), "2030-01");
    expect((await Statement.findById(st!._id).lean())!.commissionDuePkr).toBe(500);
    await expect(markStatementPaid(String(admin._id), String(st!._id), "again")).rejects.toMatchObject({ code: "invalid_state" });
  });
});
