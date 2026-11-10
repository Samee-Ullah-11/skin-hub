import { MongoMemoryServer } from "mongodb-memory-server";

let server: MongoMemoryServer | undefined;

export async function setup({ provide }: { provide: (key: "mongoUri", value: string) => void }) {
  server = await MongoMemoryServer.create();
  provide("mongoUri", server.getUri("clinics-test"));
}

export async function teardown() {
  await server?.stop();
}

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}
