import type { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/errors";
import { Clinic, type CommissionMode } from "@/models/Clinic";
import { CommissionEntry } from "@/models/Ledger";
import { zonedDateKey } from "./schedule";
import { getSettings } from "./settings";

/** Percent mode takes a share of the visit fee; fixed mode charges a flat PKR amount per completed booking. */
export function computeCommission(visitFeePkr: number, mode: CommissionMode, rate: number): number {
  if (mode === "fixed") return Math.max(0, Math.round(rate));
  return Math.max(0, Math.round((visitFeePkr * rate) / 100));
}

export function periodOf(d: Date): string {
  return zonedDateKey(d).slice(0, 7);
}

/** The month before the current one, which is what admins usually bill. */
export function previousPeriod(now = new Date()): string {
  const [y, m] = periodOf(now).split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export async function recordCommission(args: {
  clinicId: Types.ObjectId;
  bookingId: Types.ObjectId;
  visitFeePkr: number;
  completedAt: Date;
}) {
  await connectDb();
  const [settings, clinic] = await Promise.all([getSettings(), Clinic.findById(args.clinicId, { commissionOverride: 1 }).lean()]);
  const mode = clinic?.commissionOverride?.mode ?? settings.commissionMode;
  const rate = clinic?.commissionOverride?.rate ?? settings.commissionRate;
  try {
    await CommissionEntry.create({
      clinicId: args.clinicId,
      bookingId: args.bookingId,
      visitFeePkr: args.visitFeePkr,
      mode,
      rate,
      amountPkr: computeCommission(args.visitFeePkr, mode, rate),
      period: periodOf(args.completedAt),
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
}
