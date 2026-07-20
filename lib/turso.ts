import { createClient, type Client } from "@tursodatabase/serverless/compat";

export type TursoConfig = {
  url: string;
  authToken: string;
};

function configuredValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && !trimmed.startsWith("your-") ? trimmed : null;
}

/** Resolves the private Turso credentials lazily, keeping builds env-safe. */
export function getTursoConfig(): TursoConfig | null {
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
  return createClient({ url: config.url, authToken: config.authToken });
}
