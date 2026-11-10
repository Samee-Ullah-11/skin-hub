import { Schema } from "mongoose";
import { BOOKING_STATUSES, type BookingStatus } from "@config/booking";
import { defineModel, ObjectId, type Id } from "./shared";

export interface BookingHistoryEntry {
  status: BookingStatus;
  at: Date;
  by?: Id;
}

export interface BookingDoc {
  _id: Id;
  patientId: Id;
  clinicId: Id;
  doctorId: Id;
  /** Older bookings stored one treatment here; new bookings use treatmentIds. */
  treatmentId?: Id;
  treatmentIds?: Id[];
  startUtc: Date;
  endUtc: Date;
  status: BookingStatus;
  holdsSlot: boolean;
  note: string;
  expiresAt: Date;
  history: BookingHistoryEntry[];
  cancelReason?: string;
  visitFeePkr?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const historyEntry = new Schema<BookingHistoryEntry>(
  {
    status: { type: String, enum: BOOKING_STATUSES, required: true },
    at: { type: Date, required: true },
    by: { type: ObjectId, ref: "User" },
  },
  { _id: false },
);

const schema = new Schema<BookingDoc>(
  {
    patientId: { type: ObjectId, ref: "User", required: true },
    clinicId: { type: ObjectId, ref: "Clinic", required: true },
    doctorId: { type: ObjectId, ref: "Doctor", required: true },
    treatmentId: { type: ObjectId, ref: "Treatment" },
    treatmentIds: { type: [{ type: ObjectId, ref: "Treatment" }], default: undefined },
    startUtc: { type: Date, required: true },
    endUtc: { type: Date, required: true },
    status: { type: String, enum: BOOKING_STATUSES, required: true, default: "pending" },
    holdsSlot: { type: Boolean, required: true, default: true },
    note: { type: String, default: "", maxlength: 300 },
    expiresAt: { type: Date, required: true },
    history: { type: [historyEntry], default: [] },
    cancelReason: { type: String, maxlength: 300 },
    visitFeePkr: { type: Number, min: 0 },
    completedAt: Date,
  },
  { timestamps: true },
);

schema.index(
  { doctorId: 1, startUtc: 1 },
  { unique: true, partialFilterExpression: { holdsSlot: true }, name: "one_active_booking_per_slot" },
);
schema.index({ patientId: 1, status: 1, startUtc: -1 });
schema.index({ clinicId: 1, startUtc: -1 });
schema.index({ status: 1, expiresAt: 1 });

export const Booking = defineModel<BookingDoc>("Booking", schema);
