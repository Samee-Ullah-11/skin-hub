import { Schema } from "mongoose";
import { defineModel, ObjectId, type Id } from "./shared";

export type AuthTokenType = "verify_email" | "reset_password";

export interface AuthTokenDoc {
  _id: Id;
  userId: Id;
  type: AuthTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const schema = new Schema<AuthTokenDoc>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["verify_email", "reset_password"], required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

export const AuthToken = defineModel<AuthTokenDoc>("AuthToken", schema);
