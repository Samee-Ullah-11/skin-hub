import { Schema } from "mongoose";
import { defineModel, ObjectId, type Id } from "./shared";

export interface ClinicDocumentDoc {
  _id: Id;
  clinicId: Id;
  docType: string;
  publicId: string;
  resourceType: "image" | "raw";
  format: string;
  bytes: number;
  originalName: string;
  reviewStatus: "submitted" | "accepted" | "rejected";
  reviewNote?: string;
  uploadedBy: Id;
  reviewedBy?: Id;
  reviewedAt?: Date;
  purgeAfter?: Date;
  deletedAt?: Date;
  createdAt: Date;
}

const schema = new Schema<ClinicDocumentDoc>(
  {
    clinicId: { type: ObjectId, ref: "Clinic", required: true, index: true },
    docType: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    resourceType: { type: String, enum: ["image", "raw"], required: true },
    format: { type: String, required: true },
    bytes: { type: Number, required: true },
    originalName: { type: String, default: "", maxlength: 200 },
    reviewStatus: { type: String, enum: ["submitted", "accepted", "rejected"], default: "submitted" },
    reviewNote: String,
    uploadedBy: { type: ObjectId, ref: "User", required: true },
    reviewedBy: { type: ObjectId, ref: "User" },
    reviewedAt: Date,
    purgeAfter: Date,
    deletedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ purgeAfter: 1 }, { sparse: true });

export const ClinicDocument = defineModel<ClinicDocumentDoc>("ClinicDocument", schema);
