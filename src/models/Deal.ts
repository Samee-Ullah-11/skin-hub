import { Schema } from "mongoose";
import { defineModel, ObjectId, type Id } from "./shared";

/** A clinic's own time-limited discount on one of its listed treatments. */
export interface DealDoc {
  _id: Id;
  clinicId: Id;
  treatmentId: Id;
  percentOff: number;
  note: string;
  startsAt: Date;
  endsAt: Date;
  /** Set when the clinic ends the deal early. */
  endedAt?: Date;
  isSample?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<DealDoc>(
  {
    clinicId: { type: ObjectId, ref: "Clinic", required: true, index: true },
    treatmentId: { type: ObjectId, ref: "Treatment", required: true },
    percentOff: { type: Number, required: true, min: 5, max: 80 },
    note: { type: String, default: "", maxlength: 120 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    endedAt: Date,
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);
schema.index({ endsAt: 1, startsAt: 1 });

export const Deal = defineModel<DealDoc>("Deal", schema);
