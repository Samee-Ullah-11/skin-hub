import { Types, type QueryFilter } from "mongoose";
import { bookingDefaults, type BookingStatus } from "@config/booking";
import { pick, type Lang } from "@/i18n/config";
import { emails } from "@/i18n/dict/emails";
import { connectDb } from "@/lib/db";
import { AppError, isDuplicateKeyError } from "@/lib/errors";
import { formatDateTime, formatTime } from "@/lib/format";
import { Booking, type BookingDoc } from "@/models/Booking";
import { Clinic, type ClinicDoc } from "@/models/Clinic";
import { Doctor, type DoctorDoc } from "@/models/Doctor";
import { Treatment } from "@/models/Catalog";
import { User } from "@/models/User";
import { recordCommission } from "./commission";
import { notify } from "./notifications";
import { awardForCompletedBooking } from "./points";
import { computeSlots, isValidSlotStart, zonedDateKey, zonedToUtc } from "./schedule";
import { getSettings } from "./settings";

type Ctx = { clinic: ClinicDoc; doctor: DoctorDoc; patient: { _id: Types.ObjectId; name: string; phone: string } };

function whenFor(d: Date) {
  return (lang: Lang) => ({ when: formatDateTime(d, lang), time: formatTime(d, lang) });
}

async function loadContext(b: Pick<BookingDoc, "clinicId" | "doctorId" | "patientId">): Promise<Ctx | null> {
  const [clinic, doctor, patient] = await Promise.all([
    Clinic.findById(b.clinicId).lean(),
    Doctor.findById(b.doctorId).lean(),
    User.findById(b.patientId, { name: 1, phone: 1 }).lean(),
  ]);
  if (!clinic || !doctor || !patient) return null;
  return { clinic, doctor, patient };
}

function baseParams(ctx: Ctx) {
  return {
    clinic: ctx.clinic.name.en,
    doctor: ctx.doctor.name.en,
    patient: ctx.patient.name,
    address: ctx.clinic.address?.en ?? "",
  };
}

/**
 * Marks pending bookings whose reply window has passed as expired, which also frees their slot.
 * Runs before any read that depends on booking state, so no timer is needed.
 */
export async function expireStale(
  scope: { patientId?: Types.ObjectId; clinicId?: Types.ObjectId; doctorId?: Types.ObjectId } = {},
  now = new Date(),
) {
  await connectDb();
  const due = await Booking.find({ status: "pending", expiresAt: { $lte: now }, ...scope }, { _id: 1 }).limit(200).lean();
  for (const { _id } of due) {
    const b = await Booking.findOneAndUpdate(
      { _id, status: "pending", expiresAt: { $lte: now } },
      { $set: { status: "expired", holdsSlot: false }, $push: { history: { status: "expired", at: now } } },
      { returnDocument: "after" },
    ).lean();
    if (!b) continue;
    const ctx = await loadContext(b);
    if (!ctx) continue;
    const params = baseParams(ctx);
    await notify({
      userId: b.patientId,
      type: "booking_expired",
      params,
      paramsFor: whenFor(b.startUtc),
      link: "/account/bookings",
      email: { template: "bookingExpired" },
      bookingId: b._id,
    });
    await notify({
      userId: ctx.clinic.ownerId,
      type: "booking_expired",
      params,
      paramsFor: whenFor(b.startUtc),
      link: "/dashboard/bookings",
      email: { template: "bookingExpiredClinic" },
      bookingId: b._id,
    });
  }
  return due.length;
}

export async function slotsForDoctor(doctorId: string, viewerId: string | undefined, now = new Date()) {
  await connectDb();
  const doctor = await Doctor.findOne({ _id: doctorId, active: true }).lean();
  if (!doctor) throw new AppError("not_found");
  const clinic = await Clinic.findOne({ _id: doctor.clinicId, status: "approved", deletedAt: null }, { _id: 1 }).lean();
  if (!clinic) throw new AppError("not_found");
  await expireStale({ doctorId: doctor._id }, now);
  const settings = await getSettings();
  const from = zonedToUtc(zonedDateKey(now), "00:00");
  const holds = await Booking.find({ doctorId: doctor._id, holdsSlot: true, startUtc: { $gte: from } }, { startUtc: 1, patientId: 1 }).lean();
  return computeSlots({
    doctor,
    now,
    days: settings.bookingWindowDays,
    holds: holds.map((h) => ({ startUtc: h.startUtc, patientId: String(h.patientId) })),
    viewerId,
  });
}

export async function createBooking(
  patient: { id: string; emailVerified: boolean },
  input: { doctorId: string; startUtc: Date; note: string; treatmentIds?: string[] },
  now = new Date(),
) {
  if (!patient.emailVerified) throw new AppError("email_unverified");
  await connectDb();
  const doctor = await Doctor.findOne({ _id: input.doctorId, active: true }).lean();
  if (!doctor) throw new AppError("not_found");
  const clinic = await Clinic.findOne({ _id: doctor.clinicId, status: "approved", deletedAt: null }).lean();
  if (!clinic) throw new AppError("not_found");
  if (String(clinic.ownerId) === patient.id) throw new AppError("forbidden");
  // Chosen treatments must be ones this clinic lists (duplicates dropped, at most 10).
  const listed = new Set(clinic.treatments.map((x) => String(x.treatmentId)));
  const treatmentIds = [...new Set(input.treatmentIds ?? [])].filter((id) => listed.has(id)).slice(0, 10);

  const settings = await getSettings();
  const windowEnd = new Date(now.getTime() + settings.bookingWindowDays * 86400_000);
  if (input.startUtc <= now || input.startUtc > windowEnd || !isValidSlotStart(doctor, input.startUtc)) {
    throw new AppError("slot_taken");
  }

  await expireStale({ patientId: new Types.ObjectId(patient.id) }, now);
  await expireStale({ doctorId: doctor._id }, now);

  const activePending = await Booking.countDocuments({ patientId: patient.id, status: "pending" });
  if (activePending >= bookingDefaults.maxActivePendingPerPatient) throw new AppError("too_many_pending");

  const expiresAt = new Date(Math.min(now.getTime() + settings.pendingExpiryHours * 3600_000, input.startUtc.getTime()));
  let booking;
  try {
    booking = await Booking.create({
      patientId: patient.id,
      clinicId: clinic._id,
      doctorId: doctor._id,
      treatmentIds: treatmentIds.length ? treatmentIds : undefined,
      startUtc: input.startUtc,
      endUtc: new Date(input.startUtc.getTime() + doctor.slotMinutes * 60000),
      status: "pending",
      holdsSlot: true,
      note: input.note,
      expiresAt,
      history: [{ status: "pending", at: now, by: new Types.ObjectId(patient.id) }],
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new AppError("slot_taken");
    throw err;
  }

  const ctx = await loadContext(booking);
  if (ctx) {
    const params = { ...baseParams(ctx), hours: String(settings.pendingExpiryHours) };
    await notify({
      userId: booking.patientId,
      type: "booking_requested",
      textKey: "booking_requested_patient",
      params,
      paramsFor: whenFor(booking.startUtc),
      link: "/account/bookings",
      email: { template: "bookingRequestedPatient", ctaPath: "/account/bookings" },
      whatsapp: "request_received_patient",
      bookingId: booking._id,
    });
    await notify({
      userId: clinic.ownerId,
      type: "booking_requested",
      params,
      paramsFor: whenFor(booking.startUtc),
      link: "/dashboard/bookings",
      email: { template: "bookingRequestedClinic", ctaPath: "/dashboard/bookings" },
      whatsapp: "new_request_clinic",
      bookingId: booking._id,
    });
  }
  return booking.toObject();
}

async function transition(args: {
  filter: QueryFilter<BookingDoc> & { _id: Types.ObjectId; clinicId?: Types.ObjectId; patientId?: Types.ObjectId };
  to: BookingStatus;
  by: string;
  set?: Record<string, unknown>;
  now: Date;
}) {
  await connectDb();
  const releases = !["pending", "confirmed"].includes(args.to);
  const updated = await Booking.findOneAndUpdate(
    args.filter,
    {
      $set: { status: args.to, ...(releases ? { holdsSlot: false } : {}), ...(args.set ?? {}) },
      $push: { history: { status: args.to, at: args.now, by: new Types.ObjectId(args.by) } },
    },
    { returnDocument: "after" },
  ).lean();
  if (!updated) {
    const { _id, clinicId, patientId } = args.filter;
    const exists = await Booking.exists({ _id, ...(clinicId ? { clinicId } : {}), ...(patientId ? { patientId } : {}) });
    throw new AppError(exists ? "invalid_state" : "not_found");
  }
  return updated;
}

async function ownClinicId(ownerId: string): Promise<Types.ObjectId> {
  await connectDb();
  const clinic = await Clinic.findOne({ ownerId, deletedAt: null }, { _id: 1 }).lean();
  if (!clinic) throw new AppError("forbidden");
  return clinic._id;
}

function oid(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError("not_found");
  return new Types.ObjectId(id);
}

export async function confirmBooking(ownerId: string, bookingId: string, now = new Date()) {
  const clinicId = await ownClinicId(ownerId);
  await expireStale({ clinicId }, now);
  const b = await transition({
    filter: { _id: oid(bookingId), clinicId, status: "pending", expiresAt: { $gt: now } },
    to: "confirmed",
    by: ownerId,
    now,
  });
  const ctx = await loadContext(b);
  if (ctx) {
    await notify({
      userId: b.patientId,
      type: "booking_confirmed",
      params: baseParams(ctx),
      paramsFor: whenFor(b.startUtc),
      link: "/account/bookings",
      email: { template: "bookingConfirmed", ctaPath: "/account/bookings" },
      whatsapp: "confirmed",
      bookingId: b._id,
    });
  }
  return b;
}

export async function declineBooking(ownerId: string, bookingId: string, now = new Date()) {
  const clinicId = await ownClinicId(ownerId);
  const b = await transition({ filter: { _id: oid(bookingId), clinicId, status: "pending" }, to: "declined", by: ownerId, now });
  const ctx = await loadContext(b);
  if (ctx) {
    await notify({
      userId: b.patientId,
      type: "booking_declined",
      params: baseParams(ctx),
      paramsFor: whenFor(b.startUtc),
      link: "/account/bookings",
      email: { template: "bookingDeclined" },
      whatsapp: "declined",
      bookingId: b._id,
    });
  }
  return b;
}

export async function cancelByPatient(patientId: string, bookingId: string, now = new Date()) {
  const b = await transition({
    filter: { _id: oid(bookingId), patientId: oid(patientId), status: { $in: ["pending", "confirmed"] }, startUtc: { $gt: now } },
    to: "cancelled_by_patient",
    by: patientId,
    now,
  });
  const ctx = await loadContext(b);
  if (ctx) {
    await notify({
      userId: ctx.clinic.ownerId,
      type: "booking_cancelled",
      params: { ...baseParams(ctx), by: emails.en.patientWord },
      paramsFor: (lang) => ({ ...whenFor(b.startUtc)(lang), by: emails[lang].patientWord }),
      link: "/dashboard/bookings",
      email: { template: "bookingCancelled" },
      bookingId: b._id,
    });
  }
  return b;
}

export async function cancelByClinic(ownerId: string, bookingId: string, reason: string, now = new Date()) {
  const clinicId = await ownClinicId(ownerId);
  const b = await transition({
    filter: { _id: oid(bookingId), clinicId, status: { $in: ["pending", "confirmed"] }, startUtc: { $gt: now } },
    to: "cancelled_by_clinic",
    by: ownerId,
    set: { cancelReason: reason },
    now,
  });
  const ctx = await loadContext(b);
  if (ctx) {
    await notify({
      userId: b.patientId,
      type: "booking_cancelled",
      params: { ...baseParams(ctx), by: emails.en.clinicWord },
      paramsFor: (lang) => ({ ...whenFor(b.startUtc)(lang), by: emails[lang].clinicWord }),
      link: "/account/bookings",
      email: { template: "bookingCancelled", extra: reason },
      bookingId: b._id,
    });
  }
  return b;
}

export async function completeBooking(ownerId: string, bookingId: string, visitFeePkr: number | undefined, now = new Date()) {
  const clinicId = await ownClinicId(ownerId);
  const b = await transition({
    filter: { _id: oid(bookingId), clinicId, status: "confirmed", startUtc: { $lte: now } },
    to: "completed",
    by: ownerId,
    set: { completedAt: now, ...(visitFeePkr !== undefined ? { visitFeePkr } : {}) },
    now,
  });
  await recordCommission({ clinicId, bookingId: b._id, visitFeePkr: visitFeePkr ?? 0, completedAt: now });
  const earned = await awardForCompletedBooking(b._id, now);
  const ctx = await loadContext(b);
  if (ctx) {
    await notify({
      userId: b.patientId,
      type: "booking_completed",
      params: baseParams(ctx),
      paramsFor: (lang) => whenFor(b.startUtc)(lang),
      link: "/account/points",
      email: {
        template: "bookingCompleted",
        extra: earned.awarded ? emails.en.pointsEarned.replace("{points}", String(earned.points)) : undefined,
      },
      bookingId: b._id,
    });
  }
  return { booking: b, earned };
}

export async function markNoShow(ownerId: string, bookingId: string, now = new Date()) {
  const clinicId = await ownClinicId(ownerId);
  return transition({
    filter: { _id: oid(bookingId), clinicId, status: "confirmed", startUtc: { $lte: now } },
    to: "no_show",
    by: ownerId,
    now,
  });
}

/** All treatment IDs on a booking: the new list, or the single treatment older bookings stored. */
function bookingTreatmentIds(b: { treatmentId?: Types.ObjectId | string; treatmentIds?: (Types.ObjectId | string)[] }) {
  if (b.treatmentIds?.length) return b.treatmentIds;
  return b.treatmentId ? [b.treatmentId] : [];
}

async function treatmentNames(bookings: { treatmentId?: Types.ObjectId | string; treatmentIds?: (Types.ObjectId | string)[] }[]) {
  const ids = bookings.flatMap(bookingTreatmentIds);
  if (!ids.length) return new Map<string, { en: string; ur?: string }>();
  const rows = await Treatment.find({ _id: { $in: ids } }, { name: 1 }).lean();
  return new Map(rows.map((r) => [String(r._id), r.name]));
}

export async function listPatientBookings(patientId: string, now = new Date()) {
  await expireStale({ patientId: oid(patientId) }, now);
  const bookings = await Booking.find({ patientId }).sort({ startUtc: -1 }).limit(100).lean();
  const [clinics, doctors] = await Promise.all([
    Clinic.find({ _id: { $in: bookings.map((b) => b.clinicId) } }, { name: 1, slug: 1, whatsapp: 1, address: 1, phone: 1 }).lean(),
    Doctor.find({ _id: { $in: bookings.map((b) => b.doctorId) } }, { name: 1 }).lean(),
  ]);
  const tr = await treatmentNames(bookings);
  const c = new Map(clinics.map((x) => [String(x._id), x]));
  const d = new Map(doctors.map((x) => [String(x._id), x]));
  return bookings.map((b) => ({
    ...b,
    clinic: c.get(String(b.clinicId)),
    doctor: d.get(String(b.doctorId)),
    treatments: bookingTreatmentIds(b)
      .map((id) => tr.get(String(id)))
      .filter((x): x is NonNullable<typeof x> => Boolean(x)),
  }));
}

/** The patient's phone number is returned only here, scoped to bookings at the caller's own clinic. */
export async function listClinicBookings(ownerId: string, filter: { status?: BookingStatus; scope?: "upcoming" | "past" } = {}, now = new Date()) {
  const clinicId = await ownClinicId(ownerId);
  await expireStale({ clinicId }, now);
  const query: Record<string, unknown> = { clinicId };
  if (filter.status) query.status = filter.status;
  if (filter.scope === "upcoming") query.startUtc = { $gte: new Date(now.getTime() - 12 * 3600_000) };
  if (filter.scope === "past") query.startUtc = { $lt: now };
  const bookings = await Booking.find(query).sort({ startUtc: filter.scope === "past" ? -1 : 1 }).limit(200).lean();
  const [patients, doctors] = await Promise.all([
    User.find({ _id: { $in: bookings.map((b) => b.patientId) } }, { name: 1, phone: 1, locale: 1 }).lean(),
    Doctor.find({ clinicId, _id: { $in: bookings.map((b) => b.doctorId) } }, { name: 1 }).lean(),
  ]);
  const tr = await treatmentNames(bookings);
  const p = new Map(patients.map((x) => [String(x._id), x]));
  const d = new Map(doctors.map((x) => [String(x._id), x]));
  return bookings.map((b) => ({
    ...b,
    patient: p.get(String(b.patientId)),
    doctor: d.get(String(b.doctorId)),
    treatments: bookingTreatmentIds(b)
      .map((id) => tr.get(String(id)))
      .filter((x): x is NonNullable<typeof x> => Boolean(x)),
  }));
}

export async function clinicStats(clinicId: Types.ObjectId, now = new Date()) {
  await expireStale({ clinicId }, now);
  const [pending, upcoming] = await Promise.all([
    Booking.countDocuments({ clinicId, status: "pending" }),
    Booking.countDocuments({ clinicId, status: "confirmed", startUtc: { $gte: now } }),
  ]);
  return { pending, upcoming };
}

/** For the once-a-day cron: emails patients about tomorrow's confirmed visits. */
export async function sendTomorrowReminders(now = new Date()) {
  await connectDb();
  const tomorrow = zonedDateKey(new Date(now.getTime() + 86400_000));
  const from = zonedToUtc(tomorrow, "00:00");
  const to = new Date(from.getTime() + 86400_000);
  const bookings = await Booking.find({ status: "confirmed", startUtc: { $gte: from, $lt: to } }).limit(500).lean();
  for (const b of bookings) {
    const ctx = await loadContext(b);
    if (!ctx) continue;
    await notify({
      userId: b.patientId,
      type: "booking_confirmed",
      textKey: "booking_reminder",
      params: baseParams(ctx),
      paramsFor: (lang) => ({ ...whenFor(b.startUtc)(lang), clinic: pick(ctx.clinic.name, lang), doctor: pick(ctx.doctor.name, lang) }),
      link: "/account/bookings",
      email: { template: "reminder" },
      whatsapp: "reminder",
      bookingId: b._id,
    });
  }
  return bookings.length;
}

export async function responseTimeMinutes(): Promise<number | null> {
  await connectDb();
  const rows = await Booking.aggregate<{ minutes: number }>([
    { $match: { status: { $in: ["confirmed", "completed", "no_show"] } } },
    { $sort: { createdAt: -1 } },
    { $limit: 300 },
    { $project: { confirmedAt: { $filter: { input: "$history", cond: { $eq: ["$$this.status", "confirmed"] } } }, createdAt: 1 } },
    { $project: { minutes: { $divide: [{ $subtract: [{ $arrayElemAt: ["$confirmedAt.at", 0] }, "$createdAt"] }, 60000] } } },
    { $match: { minutes: { $gte: 0 } } },
    { $sort: { minutes: 1 } },
  ]);
  if (rows.length < 10) return null;
  return Math.round(rows[Math.floor(rows.length / 2)].minutes);
}
