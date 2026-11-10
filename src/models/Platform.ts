import { Schema } from "mongoose";
import { bookingDefaults } from "@config/booking";
import { defineModel, localized, ObjectId, type Id, type Localized } from "./shared";
import type { CommissionMode } from "./Clinic";

export interface RequiredDocType {
  key: string;
  label: Localized;
}

export interface SettingsDoc {
  _id: Id;
  key: "platform";
  commissionMode: CommissionMode;
  commissionRate: number;
  requiredDocTypes: RequiredDocType[];
  pendingExpiryHours: number;
  bookingWindowDays: number;
  rejectedDocsRetentionDays: number;
  updatedAt: Date;
}

const docType = new Schema<RequiredDocType>(
  { key: { type: String, required: true }, label: { type: localized(), required: true } },
  { _id: false },
);

const settings = new Schema<SettingsDoc>(
  {
    key: { type: String, enum: ["platform"], default: "platform", unique: true },
    commissionMode: { type: String, enum: ["percent", "fixed"], default: "percent" },
    commissionRate: { type: Number, default: 10, min: 0 },
    requiredDocTypes: { type: [docType], default: [] },
    pendingExpiryHours: { type: Number, default: bookingDefaults.pendingExpiryHours, min: 1, max: 168 },
    bookingWindowDays: { type: Number, default: bookingDefaults.bookingWindowDays, min: 1, max: 90 },
    rejectedDocsRetentionDays: { type: Number, default: bookingDefaults.rejectedDocsRetentionDays, min: 1 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

export const Settings = defineModel<SettingsDoc>("Settings", settings);

export interface ActivityLogDoc {
  _id: Id;
  actorId: Id;
  action: string;
  targetType: string;
  targetId?: Id;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const activity = new Schema<ActivityLogDoc>(
  {
    actorId: { type: ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: ObjectId },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
activity.index({ createdAt: -1 });

export const ActivityLog = defineModel<ActivityLogDoc>("ActivityLog", activity);

export interface WaitlistDoc {
  _id: Id;
  email: string;
  cityId: Id;
  locale: "en" | "ur";
  createdAt: Date;
}

const waitlist = new Schema<WaitlistDoc>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    cityId: { type: ObjectId, ref: "City", required: true },
    locale: { type: String, enum: ["en", "ur"], default: "en" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
waitlist.index({ email: 1, cityId: 1 }, { unique: true });

export const Waitlist = defineModel<WaitlistDoc>("Waitlist", waitlist);

export interface ContactMessageDoc {
  _id: Id;
  name: string;
  email: string;
  phone?: string;
  message: string;
  handledAt?: Date;
  createdAt: Date;
}

const contact = new Schema<ContactMessageDoc>(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    message: { type: String, required: true, maxlength: 2000 },
    handledAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
contact.index({ createdAt: -1 });

export const ContactMessage = defineModel<ContactMessageDoc>("ContactMessage", contact);
