import { cookies } from "next/headers";

export const CREW_SESSION_COOKIE = "studio_gq_crew_session";
export const CREW_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type CrewAuthConfig = {
  crewEmail: string;
  password: string;
  sessionSecret: string;
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
  return trimmed && !trimmed.startsWith("your-") ? trimmed : null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isSafePortalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

function encode(value: string) {
  return new TextEncoder().encode(value);
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return new Uint8Array(atob(padded).split("").map((character) => character.charCodeAt(0)));
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encode(value)));
}

async function passwordDigest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encode(value)));
}

/** Resolves the one shared crew identity; all settings are server-only. */
export function getCrewAuthState(): CrewAuthState {
  const rawCrewEmail = configuredValue(process.env.CREW_PORTAL_EMAIL);
  const password = configuredValue(process.env.CREW_PORTAL_PASSWORD);
  const sessionSecret = configuredValue(process.env.CREW_SESSION_SECRET);

  if (!rawCrewEmail || !password || !sessionSecret) {
    return {
      state: "unconfigured",
      reason: "Add the shared crew email, password and session secret to the server environment.",
    };
  }

  const crewEmail = normalizeEmail(rawCrewEmail);
  if (!/^\S+@\S+\.\S+$/.test(crewEmail)) {
    return { state: "unconfigured", reason: "The configured crew login email is not valid." };
  }
  if (sessionSecret.length < 32) {
    return { state: "unconfigured", reason: "The crew session secret must be at least 32 characters." };
  }
  return { state: "configured", config: { crewEmail, password, sessionSecret } };
}

async function sessionToken(session: CrewSession, config: CrewAuthConfig) {
  const expiresAt = Math.floor(Date.now() / 1000) + CREW_SESSION_MAX_AGE_SECONDS;
  const payload = base64Url(encode(JSON.stringify({ email: session.email, expiresAt })));
  const signature = base64Url(await hmac(payload, config.sessionSecret));
  return `${payload}.${signature}`;
}

async function verifySessionToken(token: string, config: CrewAuthConfig): Promise<CrewSession | null> {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  let data: { email?: unknown; expiresAt?: unknown };
  try {
    data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { email?: unknown; expiresAt?: unknown };
  } catch {
    return null;
  }
  const email = typeof data.email === "string" ? normalizeEmail(data.email) : "";
  const expiresAt = Number(data.expiresAt);
  if (!email || !Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;
  if (email !== config.crewEmail) return null;
  const expected = await hmac(payload, config.sessionSecret);
  let actual: Uint8Array;
  try {
    actual = fromBase64Url(signature);
  } catch {
    return null;
  }
  if (!equalBytes(expected, actual)) return null;
  return { userId: config.crewEmail, email: config.crewEmail };
}

export async function signInCrew(
  config: CrewAuthConfig,
  password: string,
): Promise<{ session: CrewSession; accessToken: string; maxAge: number } | null> {
  if (!password || password.length > 1_024) return null;
  const [provided, expected] = await Promise.all([passwordDigest(password), passwordDigest(config.password)]);
  if (!equalBytes(provided, expected)) return null;
  const session = { userId: config.crewEmail, email: config.crewEmail };
  return { session, accessToken: await sessionToken(session, config), maxAge: CREW_SESSION_MAX_AGE_SECONDS };
}

/** Returns the verified crew session for server-rendered portal routes. */
export async function getCrewSession(): Promise<CrewSession | null> {
  const auth = getCrewAuthState();
  if (auth.state !== "configured") return null;
  const token = (await cookies()).get(CREW_SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token, auth.config) : null;
}

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
