import { Types } from "mongoose";
import { signSession } from "@/lib/auth/jwt";
import { Category } from "@/models/Catalog";
import { Clinic } from "@/models/Clinic";
import { Doctor } from "@/models/Doctor";
import { City, Province } from "@/models/Location";
import { Settings } from "@/models/Platform";
import { User, type Role } from "@/models/User";
import { cookieJar } from "./setup";

let n = 0;

export async function makeUser(role: Role, opts: { verified?: boolean } = {}) {
  n++;
  return User.create({
    name: `Test ${role} ${n}`,
    email: `${role}-${n}@example.test`,
    phone: `+92300000${String(n).padStart(4, "0")}`,
    passwordHash: "x",
    role,
    emailVerifiedAt: opts.verified === false ? undefined : new Date(),
  });
}

/** Mon–Sat 10:00–14:00 with a 12:00–12:30 break, 30 minute slots. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  start: "10:00",
  end: "14:00",
  breaks: [{ start: "12:00", end: "12:30" }],
}));

export async function makeClinic(opts: { status?: "approved" | "pending" | "draft" } = {}) {
  n++;
  const owner = await makeUser("clinic_owner");
  const province = await Province.create({ name: { en: `P${n}` }, slug: `p-${n}` });
  const city = await City.create({ provinceId: province._id, name: { en: `C${n}` }, slug: `c-${n}`, active: true, center: { lat: 34, lng: 71.5 } });
  const category = await Category.create({ name: { en: `Cat${n}` }, slug: `cat-${n}`, active: true });
  const clinic = await Clinic.create({
    ownerId: owner._id,
    slug: `clinic-${n}`,
    name: { en: `Clinic ${n}` },
    categoryId: category._id,
    provinceId: province._id,
    cityId: city._id,
    status: opts.status ?? "approved",
    approvedAt: new Date(),
  });
  const doctor = await Doctor.create({ clinicId: clinic._id, name: { en: `Doctor ${n}` }, slotMinutes: 30, weekly: WEEKDAYS });
  return { owner, clinic, doctor };
}

export async function setSettings(values: Record<string, unknown>) {
  await Settings.updateOne({ key: "platform" }, { $set: values }, { upsert: true });
}

export async function loginAs(user: { _id: Types.ObjectId; role: Role; tokenVersion: number }) {
  cookieJar.set("session", await signSession({ sub: String(user._id), role: user.role, tv: user.tokenVersion }));
}

/** A Monday 09:00 in Pakistan (04:00 UTC), so the whole day's slots are in the future. */
export const MONDAY_9AM_PKT = new Date("2030-01-07T04:00:00.000Z");
/** 10:00 PKT on that Monday. */
export const MONDAY_10AM_PKT = new Date("2030-01-07T05:00:00.000Z");
