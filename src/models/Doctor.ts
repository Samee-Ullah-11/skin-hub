import { Schema } from "mongoose";
import { defineModel, localized, ObjectId, type Id, type Localized } from "./shared";

export interface TimeRange {
  start: string;
  end: string;
}

export interface WeeklyDay {
  weekday: number;
  start: string;
  end: string;
  breaks: TimeRange[];
}

export interface DoctorDoc {
  _id: Id;
  clinicId: Id;
  name: Localized;
  gender?: "female" | "male";
  specialty: Localized;
  qualifications: string;
  bio: Localized;
  photo?: { publicId: string; width: number; height: number };
  slotMinutes: number;
  weekly: WeeklyDay[];
  blockedDates: string[];
  active: boolean;
  isSample: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const range = new Schema<TimeRange>(
  { start: { type: String, required: true }, end: { type: String, required: true } },
  { _id: false },
);

const day = new Schema<WeeklyDay>(
  {
    weekday: { type: Number, min: 0, max: 6, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    breaks: { type: [range], default: [] },
  },
  { _id: false },
);

const schema = new Schema<DoctorDoc>(
  {
    clinicId: { type: ObjectId, ref: "Clinic", required: true, index: true },
    name: { type: localized(), required: true },
    gender: { type: String, enum: ["female", "male"] },
    specialty: { type: localized(false), default: () => ({ en: "", ur: "" }) },
    qualifications: { type: String, default: "", maxlength: 300 },
    bio: { type: localized(false), default: () => ({ en: "", ur: "" }) },
    photo: {
      type: new Schema({ publicId: String, width: Number, height: Number }, { _id: false }),
      default: undefined,
    },
    slotMinutes: { type: Number, default: 30, min: 10, max: 180 },
    weekly: { type: [day], default: [] },
    blockedDates: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    isSample: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Doctor = defineModel<DoctorDoc>("Doctor", schema);
