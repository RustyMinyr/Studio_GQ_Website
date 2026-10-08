import { createClient, type Client } from "@tursodatabase/serverless/compat";
import { createClient as createLocalClient } from "@libsql/client";
import { existsSync } from "node:fs";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

export type TursoConfig = {
  url: string;
  authToken?: string;
  local?: boolean;
};

function configuredValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && !trimmed.startsWith("your-") ? trimmed : null;
}

/** Resolves the private Turso credentials lazily, keeping builds env-safe. */
export function getTursoConfig(): TursoConfig | null {
  const databasePath = configuredValue(process.env.STUDIO_DATABASE_PATH);
  if (databasePath) {
    // Fail closed: a typo must never silently create an empty production DB.
    if (!isAbsolute(databasePath) || !existsSync(databasePath)) return null;
    return { url: pathToFileURL(databasePath).href, local: true };
  }
  const url = configuredValue(process.env.TURSO_DATABASE_URL);
  const authToken = configuredValue(process.env.TURSO_AUTH_TOKEN);
  if (!url || !authToken) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "libsql:" && parsed.protocol !== "https:") return null;
  } catch {
    return null;
  }

  return { url, authToken };
}

/** Creates a server-only Turso client after credentials have been verified. */
export function getTursoClient(config: TursoConfig): Client {
  if (config.local) return createLocalClient({ url: config.url }) as Client;
  return createClient({ url: config.url, authToken: config.authToken });
}
