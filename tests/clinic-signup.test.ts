import { describe, expect, it } from "vitest";
import { City, Province } from "@/models/Location";
import { Clinic } from "@/models/Clinic";
import { signupClinic } from "@/services/auth";

async function city(active: boolean) {
  const province = await Province.create({ name: { en: "KP" }, slug: `kp-${active}` });
  return City.create({ provinceId: province._id, name: { en: "Town" }, slug: `town-${active}`, active, center: { lat: 34, lng: 71.5 } });
}

const base = { name: "Owner Name", phone: "03001234567", password: "longpassword" };

describe("clinic registration", () => {
  it("creates a clinic owner and a draft clinic in the chosen city", async () => {
    const c = await city(true);
    const user = await signupClinic(
      { ...base, clinicName: "Glow Skin Clinic", cityId: String(c._id), email: "owner@example.test" },
      { ip: "1.1.1.1", lang: "en" },
    );
    expect(user.role).toBe("clinic_owner");
    const clinic = await Clinic.findOne({ ownerId: user._id }).lean();
    expect(clinic?.status).toBe("draft");
    expect(clinic?.name.en).toBe("Glow Skin Clinic");
    expect(String(clinic?.cityId)).toBe(String(c._id));
    expect(String(clinic?.provinceId)).toBe(String(c.provinceId));
    expect(clinic?.slug).toBe("glow-skin-clinic");
  });

  it("rejects a city that is not active", async () => {
    const c = await city(false);
    await expect(
      signupClinic({ ...base, clinicName: "X Clinic", cityId: String(c._id), email: "x@example.test" }, { ip: "1.1.1.2", lang: "en" }),
    ).rejects.toMatchObject({ code: "validation" });
  });
});
