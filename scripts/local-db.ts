import { mkdirSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";

const dbPath = ".data/mongo";
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: "wiredTiger" },
});

console.log(`Local MongoDB running at ${server.getUri()}`);
console.log("Data is kept in .data/mongo. Press Ctrl+C to stop.");

const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
