import { NextRequest, NextResponse } from "next/server";

import {
  CREW_SESSION_COOKIE,
  crewSessionCookie,
  getCrewAuthState,
  signInCrew,
} from "@/lib/crew-auth";

const MAX_BODY_BYTES = 5_000;
const RATE_LIMIT = 8;
const RATE_WINDOW_SECONDS = 15 * 60;

type RateEntry = { count: number; resetAt: number };
const requestCounts = new Map<string, RateEntry>();

function clientKey(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  );
}

function rateLimit(request: NextRequest) {
  const now = Date.now();
  const key = clientKey(request);
  const previous = requestCounts.get(key);
  const current =
    !previous || previous.resetAt <= now
      ? { count: 1, resetAt: now + RATE_WINDOW_SECONDS * 1_000 }
      : { count: previous.count + 1, resetAt: previous.resetAt };

  requestCounts.set(key, current);
  return {
    allowed: current.count <= RATE_LIMIT,
    resetSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
  };
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site" || !origin) return false;
  return origin === new URL(request.url).origin;
}

function responseHeaders() {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export async function POST(request: NextRequest) {
  const headers = responseHeaders();
  const limit = rateLimit(request);

  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many sign-in attempts. Please wait before trying again." },
      { status: 429, headers: { ...headers, "Retry-After": String(limit.resetSeconds) } },
    );
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "This sign-in request could not be accepted." },
      { status: 403, headers },
    );
  }

  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return NextResponse.json(
      { message: "Send the sign-in details as JSON." },
      { status: 415, headers },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ message: "The request is too large." }, { status: 413, headers });
  }

  let password = "";
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ message: "The request is too large." }, { status: 413, headers });
    }
    const data = JSON.parse(body) as { password?: unknown };
    password = typeof data.password === "string" ? data.password : "";
  } catch {
    return NextResponse.json({ message: "The sign-in details could not be read." }, { status: 400, headers });
  }

  const auth = getCrewAuthState();
  if (auth.state !== "configured") {
    return NextResponse.json(
      { message: "Crew portal access is not configured yet.", configured: false },
      { status: 503, headers },
    );
  }

  const result = await signInCrew(auth.config, password);
  if (!result) {
    return NextResponse.json(
      { message: "The shared crew email or password is not correct." },
      { status: 401, headers },
    );
  }

  const response = NextResponse.json(
    { message: "Signed in successfully.", configured: true },
    { status: 200, headers },
  );
  response.cookies.set(crewSessionCookie(result.accessToken, result.maxAge));
  return response;
}

export async function DELETE(request: NextRequest) {
  const headers = responseHeaders();
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "This sign-out request could not be accepted." },
      { status: 403, headers },
    );
  }

  const response = NextResponse.json({ message: "Signed out." }, { status: 200, headers });
  response.cookies.set({ name: CREW_SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}

