import { Schema } from "mongoose";
import { defineModel, localized, ObjectId, type Id, type Localized } from "./shared";

export const CLINIC_STATUSES = ["draft", "pending", "approved", "rejected", "blocked"] as const;
export type ClinicStatus = (typeof CLINIC_STATUSES)[number];

export type CommissionMode = "percent" | "fixed";

export interface ClinicPhoto {
  publicId: string;
  width: number;
  height: number;
  alt: string;
}

export interface ClinicTreatment {
  treatmentId: Id;
  fromPricePkr?: number;
}

export interface ClinicDoc {
  _id: Id;
  ownerId: Id;
  slug: string;
  name: Localized;
  categoryId?: Id;
  provinceId?: Id;
  cityId?: Id;
  areaId?: Id;
  address: Localized;
  location?: { type: "Point"; coordinates: [number, number] };
  phone: string;
  whatsapp: string;
  description: Localized;
  treatments: ClinicTreatment[];
  photos: ClinicPhoto[];
  status: ClinicStatus;
  rejectionReason?: string;
  blockReason?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  featuredFrom?: Date;
  featuredUntil?: Date;
  featuredNote?: string;
  commissionOverride?: { mode: CommissionMode; rate: number };
  isSample: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const photo = new Schema<ClinicPhoto>(
  {
    publicId: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    alt: { type: String, default: "", maxlength: 160 },
  },
  { _id: false },
);

const clinicTreatment = new Schema<ClinicTreatment>(
  {
    treatmentId: { type: ObjectId, ref: "Treatment", required: true },
    fromPricePkr: { type: Number, min: 0 },
  },
  { _id: false },
);

const schema = new Schema<ClinicDoc>(
  {
    ownerId: { type: ObjectId, ref: "User", required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    name: { type: localized(), required: true },
    categoryId: { type: ObjectId, ref: "Category" },
    provinceId: { type: ObjectId, ref: "Province" },
    cityId: { type: ObjectId, ref: "City" },
    areaId: { type: ObjectId, ref: "Area" },
    address: { type: localized(false), default: () => ({ en: "", ur: "" }) },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined },
    },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    description: { type: localized(false), default: () => ({ en: "", ur: "" }) },
    treatments: { type: [clinicTreatment], default: [] },
    photos: { type: [photo], default: [] },
    status: { type: String, enum: CLINIC_STATUSES, default: "draft" },
    rejectionReason: String,
    blockReason: String,
    submittedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    featuredFrom: Date,
    featuredUntil: Date,
    featuredNote: String,
    commissionOverride: {
      type: new Schema({ mode: { type: String, enum: ["percent", "fixed"] }, rate: Number }, { _id: false }),
      default: undefined,
    },
    isSample: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true },
);

schema.index({ status: 1, cityId: 1, deletedAt: 1 });
schema.index({ cityId: 1, areaId: 1 });
schema.index({ "treatments.treatmentId": 1 });
schema.index({ featuredUntil: 1 });
schema.index({ location: "2dsphere" }, { sparse: true });
schema.index({ "name.en": "text", "name.ur": "text" });

export const Clinic = defineModel<ClinicDoc>("Clinic", schema);
