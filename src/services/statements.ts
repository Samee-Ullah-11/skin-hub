import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { CommissionEntry, Statement } from "@/models/Ledger";
import { logActivity } from "./activity";
import { requireOwnClinic } from "./clinics";

/** Builds or refreshes one statement per clinic for the month from its commission entries. Paid statements are left alone. */
export async function generateStatements(actorId: string, period: string) {
  if (!/^\d{4}-\d{2}$/.test(period)) throw new AppError("validation");
  await connectDb();
  const rows = await CommissionEntry.aggregate<{ _id: Types.ObjectId; count: number; fees: number; due: number }>([
    { $match: { period } },
    { $group: { _id: "$clinicId", count: { $sum: 1 }, fees: { $sum: "$visitFeePkr" }, due: { $sum: "$amountPkr" } } },
  ]);
  let n = 0;
  for (const r of rows) {
    const existing = await Statement.findOne({ clinicId: r._id, period }).lean();
    if (existing?.status === "paid") continue;
    const st = await Statement.findOneAndUpdate(
      { clinicId: r._id, period },
      {
        $set: { bookingCount: r.count, totalFeesPkr: r.fees, commissionDuePkr: r.due, generatedBy: new Types.ObjectId(actorId) },
        $setOnInsert: { status: "unpaid" },
      },
      { upsert: true, returnDocument: "after" },
    );
    await CommissionEntry.updateMany({ clinicId: r._id, period }, { $set: { statementId: st!._id } });
    n++;
  }
  await logActivity(actorId, "statements.generate", "statement", undefined, { period, count: n });
  return n;
}

export async function markStatementPaid(actorId: string, statementId: string, paymentRef: string) {
  await connectDb();
  const res = await Statement.updateOne(
    { _id: statementId, status: "unpaid" },
    { $set: { status: "paid", paidAt: new Date(), paymentRef } },
  );
  if (!res.matchedCount) throw new AppError("invalid_state");
  await logActivity(actorId, "statement.paid", "statement", statementId, { paymentRef });
}

export async function listStatements(filter: { period?: string; status?: "paid" | "unpaid" } = {}) {
  await connectDb();
  return Statement.find(filter).sort({ period: -1, createdAt: -1 }).limit(300).populate("clinicId", "name slug").lean();
}

export async function unpaidByClinic() {
  await connectDb();
  return Statement.aggregate<{ _id: Types.ObjectId; due: number; count: number; name: { en: string } }>([
    { $match: { status: "unpaid" } },
    { $group: { _id: "$clinicId", due: { $sum: "$commissionDuePkr" }, count: { $sum: 1 } } },
    { $lookup: { from: "clinics", localField: "_id", foreignField: "_id", as: "clinic" } },
    { $project: { due: 1, count: 1, name: { $arrayElemAt: ["$clinic.name", 0] } } },
    { $sort: { due: -1 } },
  ]);
}

/** Read-only for the clinic owner: only statements of their own clinic. */
export async function listOwnStatements(ownerId: string) {
  const clinic = await requireOwnClinic(ownerId);
  return Statement.find({ clinicId: clinic._id }).sort({ period: -1 }).lean();
}
