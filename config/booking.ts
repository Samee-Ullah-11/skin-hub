export const bookingDefaults = {
  pendingExpiryHours: 12,
  bookingWindowDays: 30,
  maxActivePendingPerPatient: 3,
  noteMaxLength: 300,
  rejectedDocsRetentionDays: 30,
} as const;

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "declined",
  "cancelled_by_patient",
  "cancelled_by_clinic",
  "expired",
  "completed",
  "no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const SLOT_HOLDING_STATUSES: readonly BookingStatus[] = ["pending", "confirmed"];
