import { describe, expect, it } from "vitest";
import { Treatment } from "@/models/Catalog";
import { Clinic } from "@/models/Clinic";
import { ClinicLike } from "@/models/Engagement";
import { cardContext } from "@/services/public";
import { createOwnDeal, endOwnDeal, listActiveDeals } from "@/services/deals";
import { mergeGuestLikes } from "@/services/engagement";
import { makeClinic, makeUser } from "./helpers/factory";
import { cookieJar } from "./helpers/setup";

const DAY = 86400_000;

async function clinicWithTreatment(price?: number) {
  const { owner, clinic } = await makeClinic();
  const tr = await Treatment.create({
    categoryId: clinic.categoryId,
    name: { en: `Treatment ${String(clinic._id).slice(-4)}` },
    slug: `tr-${String(clinic._id)}`,
    active: true,
  });
  await Clinic.updateOne({ _id: clinic._id }, { $set: { treatments: [{ treatmentId: tr._id, fromPricePkr: price }] } });
  return { owner, clinic, tr };
}

describe("deals", () => {
  it("lists a running deal with the discounted starting price", async () => {
    const { owner, tr } = await clinicWithTreatment(10000);
    const now = new Date();
    await createOwnDeal(String(owner._id), { treatmentId: String(tr._id), percentOff: 20, startsAt: now, endsAt: new Date(now.getTime() + 7 * DAY), note: "" }, now);
    const deals = await listActiveDeals({ treatmentSlug: tr.slug }, new Date(now.getTime() + 1000));
    expect(deals).toHaveLength(1);
    expect(deals[0]).toMatchObject({ percentOff: 20, basePrice: 10000, dealPrice: 8000 });
  });

  it("rejects a treatment the clinic does not list, a bad percent and a too-long deal", async () => {
    const { owner, tr } = await clinicWithTreatment(5000);
    const other = await clinicWithTreatment(5000);
    const now = new Date();
    const base = { treatmentId: String(tr._id), percentOff: 20, startsAt: now, endsAt: new Date(now.getTime() + 7 * DAY), note: "" };
    await expect(createOwnDeal(String(owner._id), { ...base, treatmentId: String(other.tr._id) }, now)).rejects.toMatchObject({ code: "validation" });
    await expect(createOwnDeal(String(owner._id), { ...base, percentOff: 95 }, now)).rejects.toMatchObject({ code: "validation" });
    await expect(createOwnDeal(String(owner._id), { ...base, endsAt: new Date(now.getTime() + 120 * DAY) }, now)).rejects.toMatchObject({ code: "validation" });
  });

  it("hides a deal once the clinic ends it", async () => {
    const { owner, tr } = await clinicWithTreatment(4000);
    const now = new Date();
    const deal = await createOwnDeal(String(owner._id), { treatmentId: String(tr._id), percentOff: 10, startsAt: now, endsAt: new Date(now.getTime() + 5 * DAY), note: "" }, now);
    await endOwnDeal(String(owner._id), String(deal._id), new Date(now.getTime() + 1000));
    expect(await listActiveDeals({ treatmentSlug: tr.slug }, new Date(now.getTime() + 2000))).toHaveLength(0);
  });
});

describe("likes without logging in", () => {
  it("shows a visitor's cookie likes on cards and moves them into the account on login", async () => {
    const { clinic } = await makeClinic();
    cookieJar.set("guest_likes", String(clinic._id));
    const ctx = await cardContext([clinic], null);
    expect(ctx.likeMode).toBe("guest");
    expect(ctx.likes.liked.has(String(clinic._id))).toBe(true);
    expect(ctx.likes.count.get(String(clinic._id))).toBe(1);
    cookieJar.clear();

    const patient = await makeUser("patient");
    expect(await mergeGuestLikes(String(patient._id), [String(clinic._id), String(clinic._id)])).toBe(1);
    expect(await ClinicLike.countDocuments({ userId: patient._id, clinicId: clinic._id })).toBe(1);
    // Merging again does not create duplicates.
    await mergeGuestLikes(String(patient._id), [String(clinic._id)]);
    expect(await ClinicLike.countDocuments({ userId: patient._id, clinicId: clinic._id })).toBe(1);
  });

  it("gives clinic accounts no like button", async () => {
    const { clinic, owner } = await makeClinic();
    const ctx = await cardContext([clinic], { id: String(owner._id), role: "clinic_owner" });
    expect(ctx.likeMode).toBe("none");
  });
});
