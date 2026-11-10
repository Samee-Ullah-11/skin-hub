import "server-only";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import { Area, City, LocationRequest, Province } from "@/models/Location";
import type { Localized } from "@/models/shared";
import { logActivity } from "./activity";

export async function listProvinces() {
  await connectDb();
  return Province.find().sort({ sortOrder: 1, "name.en": 1 }).lean();
}

export async function listCities(opts: { activeOnly?: boolean } = {}) {
  await connectDb();
  return City.find(opts.activeOnly ? { active: true } : {}).sort({ active: -1, sortOrder: 1, "name.en": 1 }).lean();
}

export async function getCityBySlug(slug: string) {
  await connectDb();
  return City.findOne({ slug: slug.toLowerCase() }).lean();
}

export async function listAreas(cityId: string | Types.ObjectId, opts: { activeOnly?: boolean } = {}) {
  await connectDb();
  return Area.find({ cityId, ...(opts.activeOnly ? { active: true } : {}) }).sort({ "name.en": 1 }).lean();
}

export async function listAllActiveAreas() {
  await connectDb();
  return Area.find({ active: true }).sort({ "name.en": 1 }).lean();
}

export async function upsertProvince(actorId: string, input: { id?: string; name: Localized; active: boolean }) {
  await connectDb();
  const data = { name: input.name, active: input.active, slug: slugify(input.name.en) };
  const doc = input.id
    ? await Province.findByIdAndUpdate(input.id, data, { returnDocument: "after" })
    : await Province.create(data);
  if (!doc) throw new AppError("not_found");
  await logActivity(actorId, input.id ? "province.update" : "province.create", "province", doc._id, data);
  return doc;
}

export async function upsertCity(
  actorId: string,
  input: { id?: string; provinceId: string; name: Localized; active: boolean; lat: number; lng: number },
) {
  await connectDb();
  const data = {
    provinceId: input.provinceId,
    name: input.name,
    active: input.active,
    slug: slugify(input.name.en),
    center: { lat: input.lat, lng: input.lng },
  };
  const doc = input.id ? await City.findByIdAndUpdate(input.id, data, { returnDocument: "after" }) : await City.create(data);
  if (!doc) throw new AppError("not_found");
  await logActivity(actorId, input.id ? "city.update" : "city.create", "city", doc._id, { slug: data.slug, active: data.active });
  return doc;
}

export async function upsertArea(actorId: string, input: { id?: string; cityId: string; name: Localized; active: boolean }) {
  await connectDb();
  const data = { cityId: input.cityId, name: input.name, active: input.active, slug: slugify(input.name.en) };
  const doc = input.id ? await Area.findByIdAndUpdate(input.id, data, { returnDocument: "after" }) : await Area.create(data);
  if (!doc) throw new AppError("not_found");
  await logActivity(actorId, input.id ? "area.update" : "area.create", "area", doc._id, { slug: data.slug });
  return doc;
}

export async function requestLocation(
  userId: string,
  input: { kind: "city" | "area"; provinceId: string; cityId?: string; name: string; clinicId?: string },
) {
  await connectDb();
  return LocationRequest.create({ ...input, requestedBy: userId });
}

export async function listLocationRequests() {
  await connectDb();
  return LocationRequest.find({ status: "pending" }).sort({ createdAt: 1 }).lean();
}

export async function resolveLocationRequest(actorId: string, id: string, approve: boolean) {
  await connectDb();
  const req = await LocationRequest.findOne({ _id: id, status: "pending" });
  if (!req) throw new AppError("not_found");
  if (approve) {
    if (req.kind === "city") {
      if (!(await Province.exists({ _id: req.provinceId }))) throw new AppError("not_found");
      const sibling = await City.findOne({ provinceId: req.provinceId }).lean();
      await City.create({
        provinceId: req.provinceId,
        name: { en: req.name, ur: "" },
        slug: slugify(req.name),
        active: false,
        center: sibling?.center ?? { lat: 30.3753, lng: 69.3451 },
      });
    } else if (req.cityId) {
      await Area.create({ cityId: req.cityId, name: { en: req.name, ur: "" }, slug: slugify(req.name), active: true });
    }
  }
  req.status = approve ? "approved" : "rejected";
  req.resolvedBy = new Types.ObjectId(actorId);
  req.resolvedAt = new Date();
  await req.save();
  await logActivity(actorId, approve ? "location_request.approve" : "location_request.reject", "location_request", req._id, {
    name: req.name,
    kind: req.kind,
  });
}
