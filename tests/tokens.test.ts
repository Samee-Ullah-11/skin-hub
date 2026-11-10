import { describe, expect, it } from "vitest";
import { consumeToken, hashToken, issueToken } from "@/lib/auth/tokens";
import { AuthToken } from "@/models/AuthToken";
import { User } from "@/models/User";
import { verifyEmail } from "@/services/auth";
import { makeUser } from "./helpers/factory";

describe("email verification tokens", () => {
  it("stores only the hash of the token", async () => {
    const u = await makeUser("patient", { verified: false });
    const raw = await issueToken(u._id, "verify_email");
    const stored = await AuthToken.findOne({ userId: u._id }).lean();
    expect(stored!.tokenHash).toBe(hashToken(raw));
    expect(stored!.tokenHash).not.toContain(raw);
  });

  it("verifies the email with a valid token", async () => {
    const u = await makeUser("patient", { verified: false });
    const raw = await issueToken(u._id, "verify_email");
    await verifyEmail(raw);
    expect((await User.findById(u._id).lean())!.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it("rejects a reused token", async () => {
    const u = await makeUser("patient", { verified: false });
    const raw = await issueToken(u._id, "verify_email");
    await consumeToken(raw, "verify_email");
    await expect(consumeToken(raw, "verify_email")).rejects.toMatchObject({ code: "invalid_state" });
  });

  it("rejects an expired token (24 hours)", async () => {
    const u = await makeUser("patient", { verified: false });
    const issuedAt = new Date("2030-01-01T00:00:00Z");
    const raw = await issueToken(u._id, "verify_email", issuedAt);
    await expect(consumeToken(raw, "verify_email", new Date("2030-01-02T00:00:01Z"))).rejects.toMatchObject({ code: "invalid_state" });
    await expect(consumeToken(raw, "verify_email", new Date("2030-01-01T23:59:00Z"))).resolves.toBeTruthy();
  });

  it("rejects a wrong token and a token of the wrong type", async () => {
    const u = await makeUser("patient", { verified: false });
    const raw = await issueToken(u._id, "verify_email");
    await expect(consumeToken("not-a-real-token-value", "verify_email")).rejects.toMatchObject({ code: "invalid_state" });
    await expect(consumeToken(raw, "reset_password")).rejects.toMatchObject({ code: "invalid_state" });
  });

  it("invalidates the previous link when a new one is sent", async () => {
    const u = await makeUser("patient", { verified: false });
    const first = await issueToken(u._id, "verify_email");
    const second = await issueToken(u._id, "verify_email");
    await expect(consumeToken(first, "verify_email")).rejects.toMatchObject({ code: "invalid_state" });
    await expect(consumeToken(second, "verify_email")).resolves.toBeTruthy();
  });
});
