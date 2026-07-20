import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@tursodatabase/serverless/compat";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url || !authToken) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set before running this migration.");
}

const migrationPath = resolve("turso/migrations/202607200001_create_studio_booking_system.sql");
const migration = await readFile(migrationPath, "utf8");
const client = createClient({ url, authToken });

try {
  await client.executeMultiple(migration);
  console.log("Studio GQ Turso booking schema is ready.");
} finally {
  client.close();
}
