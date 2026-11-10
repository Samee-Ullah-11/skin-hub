import { Schema } from "mongoose";
import { defineModel, localized, ObjectId, type Id, type Localized } from "./shared";

export interface ClinicLikeDoc {
  _id: Id;
  userId: Id;
  clinicId: Id;
  createdAt: Date;
}

const like = new Schema<ClinicLikeDoc>(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    clinicId: { type: ObjectId, ref: "Clinic", required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
like.index({ userId: 1, clinicId: 1 }, { unique: true });

export const ClinicLike = defineModel<ClinicLikeDoc>("ClinicLike", like);

/** Entered by an admin from real patients who agreed to be quoted. Nothing is generated. */
export interface TestimonialDoc {
  _id: Id;
  name: string;
  quote: Localized;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
}

const testimonial = new Schema<TestimonialDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    quote: { type: localized(), required: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Testimonial = defineModel<TestimonialDoc>("Testimonial", testimonial);
