import { NextRequest, NextResponse } from "next/server";

import { createCrewCalendarBlock, CrewBookingError } from "@/lib/crew-bookings";
import { getCrewSession } from "@/lib/crew-auth";
import type { BookingSession } from "@/lib/booking-schema";

const MAX_BODY_BYTES = 5_000;

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return Boolean(origin) && fetchSite !== "cross-site" && origin === new URL(request.url).origin;
}

function isBookingSession(value: unknown): value is BookingSession {
  return value === "morning" || value === "afternoon" || value === "full_day";
}

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "This request could not be accepted." }, { status: 403, headers });
  }

  if (!(await getCrewSession())) {
    return NextResponse.json({ error: "Sign in to manage studio availability." }, { status: 401, headers });
  }

  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return NextResponse.json({ error: "Send the calendar update as JSON." }, { status: 415, headers });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "The request is too large." }, { status: 413, headers });
  }

  let payload: Record<string, unknown>;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "The request is too large." }, { status: 413, headers });
    }
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "The calendar update could not be read." }, { status: 400, headers });
  }

  const date = typeof payload.date === "string" ? payload.date : "";
  const session = isBookingSession(payload.session) ? payload.session : null;
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
  if (!session) {
    return NextResponse.json({ error: "Choose a valid studio time." }, { status: 400, headers });
  }

  try {
    await createCrewCalendarBlock({
      bookingDate: date,
      session,
      title: reason || "Studio unavailable",
      note: reason || undefined,
    });
    return NextResponse.json({ message: "The selected studio time is now blocked." }, { status: 201, headers });
  } catch (error) {
    const status = error instanceof CrewBookingError && error.kind === "invalid" ? 400 :
      error instanceof CrewBookingError && error.kind === "conflict" ? 409 :
        error instanceof CrewBookingError && error.kind === "configuration" ? 503 : 502;
    return NextResponse.json(
      { error: error instanceof CrewBookingError ? error.message : "The date could not be blocked." },
      { status, headers },
    );
  }
}
