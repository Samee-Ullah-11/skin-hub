import { cookies } from "next/headers";
import { GUEST_LIKES_COOKIE, parseGuestLikes } from "@/lib/guest-likes";
import type { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError, isDuplicateKeyError } from "@/lib/errors";
import { hitLimit, LIMITS } from "@/lib/rate-limit";
import { Area, City } from "@/models/Location";
import { Treatment } from "@/models/Catalog";
import { ContactMessage, Waitlist } from "@/models/Platform";
import type { ClinicDoc } from "@/models/Clinic";
import type { Lang } from "@/i18n/config";
import { likeInfo } from "./engagement";

export async function joinWaitlist(input: { email: string; citySlug: string; lang: Lang }, ip: string) {
  await hitLimit(LIMITS.waitlist, ip);
  await connectDb();
  const city = await City.findOne({ slug: input.citySlug }).lean();
  if (!city) throw new AppError("not_found");
  try {
    await Waitlist.create({ email: input.email, cityId: city._id, locale: input.lang });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
}

export async function saveContactMessage(input: { name: string; email: string; phone?: string; message: string }, ip: string) {
  await hitLimit(LIMITS.contact, ip);
  await connectDb();
  await ContactMessage.create(input);
}

/** Lookups needed to render clinic cards: area and city names, treatment names. */
/**
 * Names and like data for clinic cards. Patients like through their account; visitors who are not
 * logged in like through a browser cookie (their own like is added to the count they see);
 * clinic and admin accounts cannot like.
 */
export async function cardContext(clinics: ClinicDoc[], viewer?: { id: string; role: string } | null) {
  await connectDb();
  const ids = (key: "areaId" | "cityId") => clinics.map((c) => c[key]).filter((id): id is Types.ObjectId => Boolean(id));
  const [areas, cities, treatments] = await Promise.all([
    Area.find({ _id: { $in: ids("areaId") } }, { name: 1 }).lean(),
    City.find({ _id: { $in: ids("cityId") } }, { name: 1, slug: 1 }).lean(),
    Treatment.find({ _id: { $in: clinics.flatMap((c) => c.treatments.map((t) => t.treatmentId)) } }, { name: 1 }).lean(),
  ]);
  const likes = await likeInfo(
    clinics.map((c) => c._id),
    viewer?.role === "patient" ? viewer.id : undefined,
  );
  if (!viewer) {
    const guest = new Set(parseGuestLikes((await cookies()).get(GUEST_LIKES_COOKIE)?.value));
    for (const c of clinics) {
      const id = String(c._id);
      if (guest.has(id)) {
        likes.liked.add(id);
        likes.count.set(id, (likes.count.get(id) ?? 0) + 1);
      }
    }
  }
  return {
    areas: new Map(areas.map((a) => [String(a._id), a.name])),
    cities: new Map(cities.map((c) => [String(c._id), c.name])),
    treatments: new Map(treatments.map((t) => [String(t._id), t.name])),
    likes,
    likeMode: (!viewer ? "guest" : viewer.role === "patient" ? "account" : "none") as LikeMode,
  };
}

export type LikeMode = "account" | "guest" | "none";
