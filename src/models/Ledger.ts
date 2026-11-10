import { Schema } from "mongoose";
import { defineModel, ObjectId, type Id } from "./shared";
import type { CommissionMode } from "./Clinic";

export const POINTS_REASONS = ["visit_completed", "admin_revoke", "redemption"] as const;
export type PointsReason = (typeof POINTS_REASONS)[number];

export interface PointsEntryDoc {
  _id: Id;
  userId: Id;
  delta: number;
  reason: PointsReason;
  bookingId?: Id;
  clinicId?: Id;
  note?: string;
  createdBy?: Id;
  createdAt: Date;
}

const pointsEntry = new Schema<PointsEntryDoc>(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    delta: { type: Number, required: true },
    reason: { type: String, enum: POINTS_REASONS, required: true },
    bookingId: { type: ObjectId, ref: "Booking" },
    clinicId: { type: ObjectId, ref: "Clinic" },
    note: { type: String, maxlength: 300 },
    createdBy: { type: ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

pointsEntry.index({ userId: 1, createdAt: -1 });
pointsEntry.index(
  { bookingId: 1, reason: 1 },
  { unique: true, partialFilterExpression: { reason: "visit_completed" }, name: "one_earning_per_booking" },
);

function rejectMutation() {
  throw new Error("pointsLedger entries are immutable");
}
for (const op of [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "replaceOne",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
] as const) {
  pointsEntry.pre(op, rejectMutation);
}

export const PointsEntry = defineModel<PointsEntryDoc>("PointsEntry", pointsEntry);

export interface CommissionEntryDoc {
  _id: Id;
  clinicId: Id;
  bookingId: Id;
  visitFeePkr: number;
  mode: CommissionMode;
  rate: number;
  amountPkr: number;
  period: string;
  statementId?: Id;
  createdAt: Date;
}

const commissionEntry = new Schema<CommissionEntryDoc>(
  {
    clinicId: { type: ObjectId, ref: "Clinic", required: true },
    bookingId: { type: ObjectId, ref: "Booking", required: true, unique: true },
    visitFeePkr: { type: Number, required: true, min: 0 },
    mode: { type: String, enum: ["percent", "fixed"], required: true },
    rate: { type: Number, required: true, min: 0 },
    amountPkr: { type: Number, required: true, min: 0 },
    period: { type: String, required: true },
    statementId: { type: ObjectId, ref: "Statement" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

commissionEntry.index({ clinicId: 1, period: 1 });

export const CommissionEntry = defineModel<CommissionEntryDoc>("CommissionEntry", commissionEntry);

export interface StatementDoc {
  _id: Id;
  clinicId: Id;
  period: string;
  bookingCount: number;
  totalFeesPkr: number;
  commissionDuePkr: number;
  status: "unpaid" | "paid";
  paidAt?: Date;
  paymentRef?: string;
  generatedBy: Id;
  createdAt: Date;
  updatedAt: Date;
}

const statement = new Schema<StatementDoc>(
  {
    clinicId: { type: ObjectId, ref: "Clinic", required: true },
    period: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    bookingCount: { type: Number, required: true },
    totalFeesPkr: { type: Number, required: true },
    commissionDuePkr: { type: Number, required: true },
    status: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    paidAt: Date,
    paymentRef: { type: String, maxlength: 200 },
    generatedBy: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

statement.index({ clinicId: 1, period: 1 }, { unique: true });
statement.index({ status: 1 });

export const Statement = defineModel<StatementDoc>("Statement", statement);
