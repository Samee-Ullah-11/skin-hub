import { Schema } from "mongoose";
import { defineModel, localized, ObjectId, type Id, type Localized } from "./shared";

export interface ProvinceDoc {
  _id: Id;
  name: Localized;
  slug: string;
  active: boolean;
  sortOrder: number;
}

export interface CityDoc {
  _id: Id;
  provinceId: Id;
  name: Localized;
  slug: string;
  active: boolean;
  center: { lat: number; lng: number };
  sortOrder: number;
}

export interface AreaDoc {
  _id: Id;
  cityId: Id;
  name: Localized;
  slug: string;
  active: boolean;
}

export interface LocationRequestDoc {
  _id: Id;
  clinicId?: Id;
  requestedBy: Id;
  kind: "city" | "area";
  provinceId: Id;
  cityId?: Id;
  name: string;
  status: "pending" | "approved" | "rejected";
  resolvedBy?: Id;
  resolvedAt?: Date;
  createdAt: Date;
}

const province = new Schema<ProvinceDoc>({
  name: { type: localized(), required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

const city = new Schema<CityDoc>({
  provinceId: { type: ObjectId, ref: "Province", required: true, index: true },
  name: { type: localized(), required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  active: { type: Boolean, default: false },
  center: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  sortOrder: { type: Number, default: 0 },
});

const area = new Schema<AreaDoc>({
  cityId: { type: ObjectId, ref: "City", required: true },
  name: { type: localized(), required: true },
  slug: { type: String, required: true, lowercase: true },
  active: { type: Boolean, default: true },
});
area.index({ cityId: 1, slug: 1 }, { unique: true });

const locationRequest = new Schema<LocationRequestDoc>(
  {
    clinicId: { type: ObjectId, ref: "Clinic" },
    requestedBy: { type: ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["city", "area"], required: true },
    provinceId: { type: ObjectId, ref: "Province", required: true },
    cityId: { type: ObjectId, ref: "City" },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    resolvedBy: { type: ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Province = defineModel<ProvinceDoc>("Province", province);
export const City = defineModel<CityDoc>("City", city);
export const Area = defineModel<AreaDoc>("Area", area);
export const LocationRequest = defineModel<LocationRequestDoc>("LocationRequest", locationRequest);
