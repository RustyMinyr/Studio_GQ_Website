import { NextRequest, NextResponse } from "next/server";

import { bookingSchema } from "@/lib/booking-schema";
import {
  createBooking,
  getSupabaseConfig,
  SupabaseBookingError,
} from "@/lib/supabase-bookings";

const SITE_ORIGIN = "https://www.studiogq.co.za";
const MAX_BODY_BYTES = 20_000;
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 60;

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
      ? { count: 1, resetAt: now + RATE_WINDOW_SECONDS * 1000 }
      : { count: previous.count + 1, resetAt: previous.resetAt };

  requestCounts.set(key, current);

  if (requestCounts.size > 500) {
    for (const [entryKey, entry] of requestCounts) {
      if (entry.resetAt <= now) requestCounts.delete(entryKey);
    }
  }

  return {
    allowed: current.count <= RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - current.count),
    resetSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

function responseHeaders(remaining: number, resetSeconds: number) {
  return {
    "Cache-Control": "no-store",
    "RateLimit-Limit": String(RATE_LIMIT),
    "RateLimit-Policy": `${RATE_LIMIT};w=${RATE_WINDOW_SECONDS}`,
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(resetSeconds),
    "X-Content-Type-Options": "nosniff",
  };
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestOrigin = new URL(request.url).origin;

  if (fetchSite === "cross-site") return false;
  if (!origin) return true;

  return origin === requestOrigin || origin === SITE_ORIGIN;
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(request);
  const headers = responseHeaders(limit.remaining, limit.resetSeconds);

  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many booking attempts. Please wait a minute and try again." },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(limit.resetSeconds) },
      },
    );
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "This request could not be accepted." },
      { status: 403, headers },
    );
  }

  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return NextResponse.json(
      { message: "Send the booking as JSON." },
      { status: 415, headers },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { message: "The booking is too large." },
      { status: 413, headers },
    );
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { message: "The booking is too large." },
        { status: 413, headers },
      );
    }
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { message: "The booking could not be read." },
      { status: 400, headers },
    );
  }

  const honeypot =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).website
      : undefined;
  if (typeof honeypot === "string" && honeypot.trim()) {
    return NextResponse.json(
      { message: "Thanks. Your booking request has been received." },
      { status: 202, headers },
    );
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Check the highlighted fields and try again.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400, headers },
    );
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json(
      {
        message:
          "Online booking is not configured yet. Please contact Studio GQ directly.",
        configured: false,
      },
      { status: 503, headers },
    );
  }

  try {
    const bookingId = await createBooking(config, parsed.data);
    return NextResponse.json(
      {
        message: "Your studio booking has been received.",
        bookingId,
        configured: true,
      },
      { status: 201, headers },
    );
  } catch (error) {
    if (error instanceof SupabaseBookingError && error.kind === "conflict") {
      return NextResponse.json(
        { message: error.message, code: "slot_unavailable", configured: true },
        { status: 409, headers },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof SupabaseBookingError
            ? error.message
            : "The booking could not be saved. Please try again.",
        configured: true,
      },
      { status: 502, headers },
    );
  }
}

