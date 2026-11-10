import { Schema } from "mongoose";
import { defineModel, type Id } from "./shared";

export const ROLES = ["patient", "clinic_owner", "admin"] as const;
export type Role = (typeof ROLES)[number];

export interface UserDoc {
  _id: Id;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
  emailVerifiedAt?: Date;
  tokenVersion: number;
  locale: "en" | "ur";
  disabledAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    emailVerifiedAt: Date,
    tokenVersion: { type: Number, default: 0 },
    locale: { type: String, enum: ["en", "ur"], default: "en" },
    disabledAt: Date,
    deletedAt: Date,
  },
  { timestamps: true },
);

schema.index({ role: 1, createdAt: -1 });

export const User = defineModel<UserDoc>("User", schema);
