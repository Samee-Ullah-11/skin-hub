"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { formLang, runAction, type ActionState } from "@/lib/action";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { requireOwnClinic, submitOwnClinic, updateOwnProfile } from "@/services/clinics";
import { createOwnDoctor, updateOwnDoctor } from "@/services/doctors";
import { removeOwnDocument, removeOwnPhoto } from "@/services/documents";
import { requestLocation } from "@/services/locations";
import { clinicProfileSchema, doctorSchema, locationRequestSchema } from "@/validation/clinic";
import { objectId } from "@/validation/common";

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) out[i.path.map(String).join(".")] ??= i.message;
  return out;
}

export async function updateClinicProfileAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser("clinic_owner");
    const treatmentIds = form.getAll("treatment[]").map(String);
    const raw = {
      name: { en: str(form, "name.en"), ur: str(form, "name.ur") },
      categoryId: str(form, "categoryId"),
      provinceId: str(form, "provinceId"),
      cityId: str(form, "cityId"),
      areaId: str(form, "areaId"),
      address: { en: str(form, "address.en"), ur: str(form, "address.ur") },
      lat: str(form, "lat") || undefined,
      lng: str(form, "lng") || undefined,
      phone: str(form, "phone"),
      whatsapp: str(form, "whatsapp"),
      description: { en: str(form, "description.en"), ur: str(form, "description.ur") },
      treatments: treatmentIds.map((id) => {
        const price = str(form, `price_${id}`);
        return { treatmentId: id, fromPricePkr: price ? Number(price) : undefined };
      }),
    };
    const parsed = clinicProfileSchema.safeParse(raw);
    if (!parsed.success) throw new AppError("validation", "invalid_form", fieldErrorsFrom(parsed.error.issues));
    await updateOwnProfile(user.id, parsed.data);
    revalidatePath(localePath(lang, "/dashboard"), "layout");
    return { ok: true, message: getDict(lang).common.saved };
  });
}

export async function submitClinicAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser("clinic_owner");
    try {
      await submitOwnClinic(user.id);
    } catch (err) {
      if (err instanceof AppError && err.code === "validation") return { ok: false, error: getDict(lang).dashboard.incomplete };
      throw err;
    }
    revalidatePath(localePath(lang, "/dashboard"));
    return { ok: true, message: getDict(lang).dashboard.submitted };
  });
}

export async function requestLocationAction(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const user = await requireUser("clinic_owner");
    const clinic = await requireOwnClinic(user.id);
    const parsed = locationRequestSchema.safeParse({
      kind: str(form, "kind"),
      provinceId: str(form, "provinceId"),
      cityId: str(form, "cityId") || undefined,
      name: str(form, "name"),
    });
    if (!parsed.success) throw new AppError("validation", "invalid_form", fieldErrorsFrom(parsed.error.issues));
    if (parsed.data.kind === "area" && !parsed.data.cityId) throw new AppError("validation", "city", { cityId: "required" });
    await requestLocation(user.id, { ...parsed.data, clinicId: String(clinic._id) });
    return { ok: true, message: getDict(lang).dashboard.requestSent };
  });
}

function parseDoctorForm(form: FormData) {
  const weekly = [0, 1, 2, 3, 4, 5, 6]
    .filter((d) => form.get(`day_${d}_on`) === "on")
    .map((d) => {
      const bs = str(form, `day_${d}_bstart`);
      const be = str(form, `day_${d}_bend`);
      return {
        weekday: d,
        start: str(form, `day_${d}_start`),
        end: str(form, `day_${d}_end`),
        breaks: bs && be ? [{ start: bs, end: be }] : [],
      };
    });
  const gender = str(form, "gender");
  return doctorSchema.safeParse({
    name: { en: str(form, "name.en"), ur: str(form, "name.ur") },
    gender: gender === "female" || gender === "male" ? gender : undefined,
    specialty: { en: str(form, "specialty.en"), ur: str(form, "specialty.ur") },
    qualifications: str(form, "qualifications"),
    bio: { en: str(form, "bio.en"), ur: str(form, "bio.ur") },
    slotMinutes: str(form, "slotMinutes"),
    weekly,
    blockedDates: [...new Set(form.getAll("blocked[]").map(String).filter(Boolean))].sort(),
    active: form.get("active") === "on",
  });
}

export async function saveDoctorAction(_: ActionState, form: FormData): Promise<ActionState> {
  const lang = formLang(form);
  let createdId = "";
  const state = await runAction(form, async () => {
    const user = await requireUser("clinic_owner");
    const parsed = parseDoctorForm(form);
    if (!parsed.success) throw new AppError("validation", "invalid_form", fieldErrorsFrom(parsed.error.issues));
    const id = str(form, "doctorId");
    if (id) {
      objectId.parse(id);
      await updateOwnDoctor(user.id, id, parsed.data);
    } else {
      createdId = String((await createOwnDoctor(user.id, parsed.data))._id);
    }
    revalidatePath(localePath(lang, "/dashboard/doctors"));
    return { ok: true, message: getDict(lang).dashboard.doctorSaved };
  });
  if (createdId) redirect(localePath(lang, `/dashboard/doctors/${createdId}`));
  return state;
}

export async function removePhotoAction(form: FormData) {
  const user = await requireUser("clinic_owner");
  await removeOwnPhoto(user.id, str(form, "publicId"));
  revalidatePath(localePath(formLang(form), "/dashboard/profile"));
}

export async function removeDocumentAction(form: FormData) {
  const user = await requireUser("clinic_owner");
  await removeOwnDocument(user.id, objectId.parse(str(form, "documentId")));
  revalidatePath(localePath(formLang(form), "/dashboard/documents"));
}
