import { Schema } from "mongoose";
import { defineModel } from "./shared";

export interface RateLimitDoc {
  key: string;
  count: number;
  expiresAt: Date;
}

const schema = new Schema<RateLimitDoc>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
});

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = defineModel<RateLimitDoc>("RateLimit", schema);
