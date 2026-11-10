import { Schema } from "mongoose";
import { defineModel, localized, ObjectId, type Id, type Localized } from "./shared";

export interface CategoryDoc {
  _id: Id;
  name: Localized;
  slug: string;
  active: boolean;
  sortOrder: number;
}

export interface TreatmentDoc {
  _id: Id;
  categoryId: Id;
  name: Localized;
  slug: string;
  active: boolean;
  imagePublicId?: string;
  sortOrder: number;
}

const category = new Schema<CategoryDoc>({
  name: { type: localized(), required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  active: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
});

const treatment = new Schema<TreatmentDoc>({
  categoryId: { type: ObjectId, ref: "Category", required: true, index: true },
  name: { type: localized(), required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  active: { type: Boolean, default: true },
  imagePublicId: String,
  sortOrder: { type: Number, default: 0 },
});

export const Category = defineModel<CategoryDoc>("Category", category);
export const Treatment = defineModel<TreatmentDoc>("Treatment", treatment);
