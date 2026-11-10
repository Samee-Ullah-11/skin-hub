import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, inject, vi } from "vitest";

process.env.MONGODB_URI = inject("mongoUri");
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-0123456789";
process.env.APP_URL = "http://localhost:3000";
process.env.EMAIL_PROVIDER = "console";

const jar = new Map<string, string>();

/** Server actions read cookies and headers; tests drive them through this fake jar. */
export const cookieJar = {
  set: (name: string, value: string) => jar.set(name, value),
  clear: () => jar.clear(),
};

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
  headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }),
}));

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

beforeAll(async () => {
  const { connectDb } = await import("@/lib/db");
  await connectDb();
  await import("@/models/Booking");
  await import("@/models/Ledger");
  await import("@/models/AuthToken");
  await mongoose.connection.syncIndexes();
});

beforeEach(async () => {
  cookieJar.clear();
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});
