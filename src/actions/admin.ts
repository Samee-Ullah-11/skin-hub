"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fmt } from "@/i18n/config";
import { getDict } from "@/i18n";
import { parseForm, runAction, type ActionState } from "@/lib/action";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import * as adminService from "@/services/admin";
import * as catalog from "@/services/catalog";
import * as clinics from "@/services/clinics";
import { reviewDocument } from "@/services/documents";
import * as engagement from "@/services/engagement";
import * as locations from "@/services/locations";
import { revokePoints } from "@/services/points";
import { updateSettings } from "@/services/settings";
import { generateStatements, markStatementPaid } from "@/services/statements";
import { zonedToUtc } from "@/services/schedule";
import { checkbox, email, objectId, optionalText, text } from "@/validation/common";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const loc = z.object({ en: text(80), ur: optionalText(80), active: checkbox, id: objectId.optional().or(z.literal("").transform(() => undefined)) });

/** One entry point for the admin forms. Every op re-checks the admin role on the server. */
export async function adminOp(_: ActionState, form: FormData): Promise<ActionState> {
  return runAction(form, async (lang) => {
    const me = await requireUser("admin");
    const op = String(form.get("op") ?? "");
    const t = getDict(lang).admin;

    switch (op) {
      case "clinic.approve": {
        const { clinicId } = parseForm(z.object({ clinicId: objectId }), form);
        await clinics.approveClinic(me.id, clinicId);
        break;
      }
      case "clinic.reject": {
        const { clinicId, reason } = parseForm(z.object({ clinicId: objectId, reason: text(500, 5) }), form);
        await clinics.rejectClinic(me.id, clinicId, reason);
        break;
      }
      case "clinic.block": {
        const { clinicId, reason } = parseForm(z.object({ clinicId: objectId, reason: text(500, 5) }), form);
        await clinics.blockClinic(me.id, clinicId, reason);
        break;
      }
      case "clinic.unblock": {
        const { clinicId } = parseForm(z.object({ clinicId: objectId }), form);
        await clinics.unblockClinic(me.id, clinicId);
        break;
      }
      case "clinic.delete": {
        const { clinicId } = parseForm(z.object({ clinicId: objectId, confirm: z.literal("DELETE", { error: "required" }) }), form);
        await clinics.softDeleteClinic(me.id, clinicId);
        break;
      }
      case "clinic.feature": {
        const v = parseForm(z.object({ clinicId: objectId, from: date, until: date, note: optionalText(200) }), form);
        const from = zonedToUtc(v.from, "00:00");
        const until = new Date(zonedToUtc(v.until, "00:00").getTime() + 86400_000 - 1000);
        if (until <= from) throw new AppError("validation", "range", { until: "required" });
        await clinics.setFeatured(me.id, v.clinicId, { from, until, note: v.note });
        break;
      }
      case "clinic.unfeature": {
        const { clinicId } = parseForm(z.object({ clinicId: objectId }), form);
        await clinics.setFeatured(me.id, clinicId, {});
        break;
      }
      case "clinic.commission": {
        const v = parseForm(
          z.object({ clinicId: objectId, mode: z.enum(["", "percent", "fixed"]), rate: z.coerce.number().min(0).max(1_000_000).optional() }),
          form,
        );
        await clinics.setCommissionOverride(me.id, v.clinicId, v.mode ? { mode: v.mode, rate: v.rate ?? 0 } : undefined);
        break;
      }
      case "doc.review": {
        const v = parseForm(z.object({ documentId: objectId, accept: z.enum(["1", "0"]), note: optionalText(300) }), form);
        await reviewDocument(me.id, v.documentId, v.accept === "1", v.note);
        break;
      }
      case "user.disable":
      case "user.enable": {
        const { userId } = parseForm(z.object({ userId: objectId }), form);
        await adminService.setUserDisabled(me.id, userId, op === "user.disable");
        break;
      }
      case "user.revoke": {
        const { userId } = parseForm(z.object({ userId: objectId }), form);
        await adminService.revokeUserSessions(me.id, userId);
        break;
      }
      case "province.save": {
        const v = parseForm(loc, form);
        await locations.upsertProvince(me.id, { id: v.id, name: { en: v.en, ur: v.ur }, active: v.active });
        break;
      }
      case "city.save": {
        const v = parseForm(loc.extend({ provinceId: objectId, lat: z.coerce.number().min(23).max(37.5), lng: z.coerce.number().min(60).max(78) }), form);
        await locations.upsertCity(me.id, { id: v.id, provinceId: v.provinceId, name: { en: v.en, ur: v.ur }, active: v.active, lat: v.lat, lng: v.lng });
        break;
      }
      case "area.save": {
        const v = parseForm(loc.extend({ cityId: objectId }), form);
        await locations.upsertArea(me.id, { id: v.id, cityId: v.cityId, name: { en: v.en, ur: v.ur }, active: v.active });
        break;
      }
      case "locreq.resolve": {
        const v = parseForm(z.object({ id: objectId, approve: z.enum(["1", "0"]) }), form);
        await locations.resolveLocationRequest(me.id, v.id, v.approve === "1");
        break;
      }
      case "category.save": {
        const v = parseForm(loc, form);
        await catalog.upsertCategory(me.id, { id: v.id, name: { en: v.en, ur: v.ur }, active: v.active });
        break;
      }
      case "treatment.save": {
        const v = parseForm(loc.extend({ categoryId: objectId }), form);
        await catalog.upsertTreatment(me.id, { id: v.id, categoryId: v.categoryId, name: { en: v.en, ur: v.ur }, active: v.active });
        break;
      }
      case "statements.generate": {
        const { period } = parseForm(z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) }), form);
        const n = await generateStatements(me.id, period);
        revalidatePath("/", "layout");
        return { ok: true, message: fmt(t.generated, { count: n }) };
      }
      case "statement.paid": {
        const v = parseForm(z.object({ id: objectId, ref: text(200) }), form);
        await markStatementPaid(me.id, v.id, v.ref);
        break;
      }
      case "points.revoke": {
        const v = parseForm(z.object({ email, amount: z.coerce.number().int().min(1).max(100000), note: text(300, 3) }), form);
        const user = await adminService.findUserByEmail(v.email);
        if (!user) throw new AppError("validation", "user", { email: "not_found" });
        await revokePoints(me.id, String(user._id), v.amount, v.note);
        revalidatePath("/", "layout");
        return { ok: true, message: t.revoked };
      }
      case "settings.save": {
        const v = parseForm(
          z.object({
            commissionMode: z.enum(["percent", "fixed"]),
            commissionRate: z.coerce.number().min(0).max(1_000_000),
            pendingExpiryHours: z.coerce.number().int().min(1).max(168),
            bookingWindowDays: z.coerce.number().int().min(1).max(90),
            rejectedDocsRetentionDays: z.coerce.number().int().min(1).max(3650),
            requiredDocs: z.string().max(5000),
          }),
          form,
        );
        const requiredDocTypes = v.requiredDocs
          .split("\n")
          .map((line) => line.split("|").map((s) => s.trim()))
          .filter((p) => p[0] && p[1])
          .map(([key, en, ur]) => ({ key: key.replace(/[^\w-]/g, "_").slice(0, 60), label: { en, ur: ur ?? "" } }));
        await updateSettings(me.id, { ...v, requiredDocTypes });
        break;
      }
      case "testimonial.save": {
        const v = parseForm(
          z.object({
            id: objectId.optional().or(z.literal("").transform(() => undefined)),
            name: text(80, 2),
            quoteEn: text(600, 5),
            quoteUr: optionalText(600),
            active: checkbox,
          }),
          form,
        );
        await engagement.saveTestimonial(me.id, { id: v.id, name: v.name, quote: { en: v.quoteEn, ur: v.quoteUr }, active: v.active });
        break;
      }
      case "testimonial.delete": {
        const { id } = parseForm(z.object({ id: objectId }), form);
        await engagement.deleteTestimonial(me.id, id);
        break;
      }
      case "message.handled": {
        const { id } = parseForm(z.object({ id: objectId }), form);
        await adminService.markMessageHandled(me.id, id);
        break;
      }
      default:
        throw new AppError("validation", "unknown_op");
    }
    revalidatePath("/", "layout");
    return { ok: true, message: t.saved };
  });
}
