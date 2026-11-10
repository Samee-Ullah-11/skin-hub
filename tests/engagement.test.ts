import { describe, expect, it } from "vitest";
import { likeInfo, toggleLike } from "@/services/engagement";
import { makeClinic, makeUser } from "./helpers/factory";

describe("clinic likes", () => {
  it("toggles a patient's like and counts it once", async () => {
    const { clinic } = await makeClinic();
    const p = await makeUser("patient");
    expect(await toggleLike(String(p._id), String(clinic._id))).toEqual({ liked: true, count: 1 });
    const info = await likeInfo([clinic._id], String(p._id));
    expect(info.count.get(String(clinic._id))).toBe(1);
    expect(info.liked.has(String(clinic._id))).toBe(true);
    expect(await toggleLike(String(p._id), String(clinic._id))).toEqual({ liked: false, count: 0 });
  });

  it("cannot like a clinic that is not approved", async () => {
    const { clinic } = await makeClinic({ status: "pending" });
    const p = await makeUser("patient");
    await expect(toggleLike(String(p._id), String(clinic._id))).rejects.toMatchObject({ code: "not_found" });
  });
});
