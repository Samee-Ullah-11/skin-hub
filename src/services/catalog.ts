import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import { Category, Treatment } from "@/models/Catalog";
import type { Localized } from "@/models/shared";
import { logActivity } from "./activity";

export async function listCategories(opts: { activeOnly?: boolean } = {}) {
  await connectDb();
  return Category.find(opts.activeOnly ? { active: true } : {}).sort({ sortOrder: 1 }).lean();
}

export async function listTreatments(opts: { activeOnly?: boolean; categoryId?: string } = {}) {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (opts.categoryId) filter.categoryId = opts.categoryId;
  if (opts.activeOnly) {
    const activeCats = await Category.find({ active: true }, { _id: 1 }).lean();
    filter.active = true;
    filter.categoryId = opts.categoryId ?? { $in: activeCats.map((c) => c._id) };
  }
  return Treatment.find(filter).sort({ sortOrder: 1, "name.en": 1 }).lean();
}

export async function getTreatmentBySlug(slug: string) {
  await connectDb();
  return Treatment.findOne({ slug, active: true }).lean();
}

export async function upsertCategory(actorId: string, input: { id?: string; name: Localized; active: boolean }) {
  await connectDb();
  const data = { name: input.name, active: input.active, slug: slugify(input.name.en) };
  const doc = input.id
    ? await Category.findByIdAndUpdate(input.id, data, { returnDocument: "after" })
    : await Category.create(data);
  if (!doc) throw new AppError("not_found");
  await logActivity(actorId, input.id ? "category.update" : "category.create", "category", doc._id, data);
}

export async function upsertTreatment(
  actorId: string,
  input: { id?: string; categoryId: string; name: Localized; active: boolean },
) {
  await connectDb();
  const data = { categoryId: input.categoryId, name: input.name, active: input.active, slug: slugify(input.name.en) };
  const doc = input.id
    ? await Treatment.findByIdAndUpdate(input.id, data, { returnDocument: "after" })
    : await Treatment.create(data);
  if (!doc) throw new AppError("not_found");
  await logActivity(actorId, input.id ? "treatment.update" : "treatment.create", "treatment", doc._id, { slug: data.slug });
}
