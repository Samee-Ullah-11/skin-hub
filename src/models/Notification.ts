import { Schema } from "mongoose";
import { defineModel, ObjectId, type Id } from "./shared";

export const NOTIFICATION_TYPES = [
  "booking_requested",
  "booking_confirmed",
  "booking_declined",
  "booking_expired",
  "booking_cancelled",
  "booking_completed",
  "clinic_approved",
  "clinic_rejected",
  "clinic_blocked",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationDoc {
  _id: Id;
  userId: Id;
  type: NotificationType;
  params: Record<string, string>;
  link: string;
  readAt?: Date;
  createdAt: Date;
}

const schema = new Schema<NotificationDoc>(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    params: { type: Schema.Types.Mixed, default: {} },
    link: { type: String, default: "" },
    readAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ userId: 1, readAt: 1, createdAt: -1 });
schema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 3600 });

export const Notification = defineModel<NotificationDoc>("Notification", schema);

export interface EmailLogDoc {
  _id: Id;
  to: string;
  template: string;
  provider: string;
  status: "sent" | "failed";
  error?: string;
  bookingId?: Id;
  createdAt: Date;
}

const emailLog = new Schema<EmailLogDoc>(
  {
    to: { type: String, required: true },
    template: { type: String, required: true },
    provider: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    error: String,
    bookingId: { type: ObjectId, ref: "Booking" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

emailLog.index({ status: 1, createdAt: -1 });

export const EmailLog = defineModel<EmailLogDoc>("EmailLog", emailLog);
