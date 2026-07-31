import { NextRequest, NextResponse } from "next/server";

import { notifyStudioOfEnquiry } from "@/lib/enquiry-email";
import { enquirySchema } from "@/lib/enquiry-schema";

const SITE_ORIGIN = "https://www.studiogq.co.za";
const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT = 6;
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

  if (fetchSite === "cross-site" || !origin) return false;
  return origin === requestOrigin || origin === SITE_ORIGIN;
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(request);
  const headers = responseHeaders(limit.remaining, limit.resetSeconds);

  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many enquiries. Please wait a minute and try again." },
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
      { message: "Send the enquiry as JSON." },
      { status: 415, headers },
    );
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { message: "The enquiry is too large." },
      { status: 413, headers },
    );
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { message: "The enquiry is too large." },
        { status: 413, headers },
      );
    }
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { message: "The enquiry could not be read." },
      { status: 400, headers },
    );
  }

  const honeypot =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).website
      : undefined;
  if (typeof honeypot === "string" && honeypot.trim()) {
    return NextResponse.json(
      { message: "Thanks. Your enquiry has been received." },
      { status: 202, headers },
    );
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Check the highlighted fields and try again.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400, headers },
    );
  }

  const result = await notifyStudioOfEnquiry(parsed.data);
  if (!result.sent) {
    return NextResponse.json(
      {
        message:
          result.reason === "not_configured"
            ? "Online enquiries are temporarily unavailable. Please email bookings@studiogq.co.za."
            : "We could not send your enquiry. Please try again or email bookings@studiogq.co.za.",
      },
      { status: result.reason === "not_configured" ? 503 : 502, headers },
    );
  }

  return NextResponse.json(
    {
      message:
        parsed.data.kind === "workshop_interest"
          ? "Thanks — your workshop interest has been registered. We’ll share details when the first date is announced."
          : parsed.data.kind === "newsletter"
            ? "Thanks — your request for Studio GQ updates has been received."
            : "Thanks — your enquiry has been sent. A member of the Studio GQ team will be in touch shortly.",
    },
    { status: 201, headers },
  );
}
