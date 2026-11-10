import { section } from "../section";

export const notifications = section(
  {
    booking_requested: "New request from {patient} for {when}",
    booking_requested_patient: "Request sent to {clinic} for {when}",
    booking_confirmed: "{clinic} confirmed your visit on {when}",
    booking_declined: "{clinic} declined your request for {when}",
    booking_expired: "Request for {when} expired without a reply",
    booking_cancelled: "Booking on {when} was cancelled",
    booking_completed: "Visit on {when} marked completed",
    booking_reminder: "Reminder: {clinic} on {when}",
    clinic_approved: "Your clinic was approved and is now live",
    clinic_rejected: "Your clinic needs changes: {reason}",
    clinic_blocked: "Your clinic was blocked: {reason}",
  },
  {
    booking_requested: "{patient} کی جانب سے {when} کی نئی درخواست",
    booking_requested_patient: "{clinic} کو {when} کی درخواست بھیج دی گئی",
    booking_confirmed: "{clinic} نے {when} کا وقت تصدیق کر دیا",
    booking_declined: "{clinic} نے {when} کی درخواست نامنظور کی",
    booking_expired: "{when} کی درخواست جواب کے بغیر ختم ہو گئی",
    booking_cancelled: "{when} کی بکنگ منسوخ ہو گئی",
    booking_completed: "{when} کی ملاقات مکمل قرار دی گئی",
    booking_reminder: "یاد دہانی: {when} کو {clinic}",
    clinic_approved: "آپ کا کلینک منظور ہو کر فعال ہو گیا",
    clinic_rejected: "آپ کے کلینک میں تبدیلی درکار ہے: {reason}",
    clinic_blocked: "آپ کا کلینک بلاک کر دیا گیا: {reason}",
  },
);
