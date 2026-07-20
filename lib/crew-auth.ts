import { cookies } from "next/headers";

const SUPABASE_TIMEOUT_MS = 8_000;

export const CREW_SESSION_COOKIE = "studio_gq_crew_session";
export const CREW_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type CrewAuthConfig = {
  url: string;
  publicKey: string;
  serviceRoleKey: string;
  crewEmail: string;
};

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
};

type SupabaseSignInResponse = {
  access_token?: string;
  expires_in?: number;
  user?: SupabaseAuthUser;
};

export type CrewSession = {
  userId: string;
  email: string;
};

export type CrewAuthState =
  | { state: "configured"; config: CrewAuthConfig }
  | { state: "unconfigured"; reason: string };

function configuredValue(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith("your-")) return null;
  return trimmed;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isSafePortalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

/**
 * Resolves all server-only values required for the shared crew identity.
 * This function is intentionally lazy so builds work without production env vars.
 */
export function getCrewAuthState(): CrewAuthState {
  const url = configuredValue(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  )?.replace(/\/$/, "");
  const publicKey = configuredValue(
    process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY,
  );
  const serviceRoleKey = configuredValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const rawCrewEmail = configuredValue(process.env.CREW_PORTAL_EMAIL);

  if (!url || !publicKey || !serviceRoleKey || !rawCrewEmail) {
    return {
      state: "unconfigured",
      reason:
        "Crew portal access is not configured yet. Add the Supabase and crew login settings to the server environment.",
    };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      throw new Error("Unsupported Supabase URL");
    }
  } catch {
    return {
      state: "unconfigured",
      reason: "The configured Supabase URL is not valid.",
    };
  }

  const crewEmail = normalizeEmail(rawCrewEmail);
  if (!/^\S+@\S+\.\S+$/.test(crewEmail)) {
    return {
      state: "unconfigured",
      reason: "The configured crew login email is not valid.",
    };
  }

  return { state: "configured", config: { url, publicKey, serviceRoleKey, crewEmail } };
}

function authHeaders(config: CrewAuthConfig, accessToken?: string) {
  return {
    apikey: config.publicKey,
    Authorization: `Bearer ${accessToken ?? config.publicKey}`,
    "Content-Type": "application/json",
  };
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function verifyCrewAccessToken(
  config: CrewAuthConfig,
  accessToken: string,
): Promise<CrewSession | null> {
  if (!accessToken || accessToken.length > 8_000) return null;

  try {
    const response = await fetch(`${config.url}/auth/v1/user`, {
      headers: authHeaders(config, accessToken),
      cache: "no-store",
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const user = await readJson<SupabaseAuthUser>(response);
    const email = user?.email ? normalizeEmail(user.email) : "";
    if (!user?.id || email !== config.crewEmail) return null;

    return { userId: user.id, email };
  } catch {
    return null;
  }
}

export async function signInCrew(
  config: CrewAuthConfig,
  password: string,
): Promise<{ session: CrewSession; accessToken: string; maxAge: number } | null> {
  if (!password || password.length > 1_024) return null;

  try {
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: authHeaders(config),
      body: JSON.stringify({ email: config.crewEmail, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const result = await readJson<SupabaseSignInResponse>(response);
    const accessToken = result?.access_token;
    if (!accessToken) return null;

    const session = await verifyCrewAccessToken(config, accessToken);
    if (!session) return null;

    const expiresIn = Number(result.expires_in);
    const maxAge = Number.isFinite(expiresIn)
      ? Math.max(60, Math.min(CREW_SESSION_MAX_AGE_SECONDS, Math.floor(expiresIn)))
      : CREW_SESSION_MAX_AGE_SECONDS;

    return { session, accessToken, maxAge };
  } catch {
    return null;
  }
}

/** Returns the verified crew session for server-rendered portal routes. */
export async function getCrewSession(): Promise<CrewSession | null> {
  const auth = getCrewAuthState();
  if (auth.state !== "configured") return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(CREW_SESSION_COOKIE)?.value;
  if (!accessToken) return null;

  return verifyCrewAccessToken(auth.config, accessToken);
}

/** Builds a safe login destination for future protected crew portal routes. */
export function crewLoginUrl(nextPath = "/crew") {
  const safeNextPath = isSafePortalPath(nextPath) ? nextPath : "/crew";
  return `/crew/login?next=${encodeURIComponent(safeNextPath)}`;
}

export function crewSessionCookie(accessToken: string, maxAge = CREW_SESSION_MAX_AGE_SECONDS) {
  return {
    name: CREW_SESSION_COOKIE,
    value: accessToken,
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(60, Math.min(CREW_SESSION_MAX_AGE_SECONDS, maxAge)),
  };
}
