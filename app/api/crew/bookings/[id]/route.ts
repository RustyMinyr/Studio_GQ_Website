import { NextRequest, NextResponse } from "next/server";

import {
  cancelCrewBooking,
  confirmCrewBooking,
  CrewBookingError,
  rescheduleCrewBooking,
} from "@/lib/crew-bookings";
import { getCrewSession } from "@/lib/crew-auth";
import type { BookingSession } from "@/lib/booking-schema";

const MAX_BODY_BYTES = 5_000;

type CrewBookingAction =
  | { action: "confirm" }
  | { action: "cancel" }
  | { action: "reschedule"; date: string; session: BookingSession };

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return Boolean(origin) && fetchSite !== "cross-site" && origin === new URL(request.url).origin;
}

function responseHeaders() {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

function isBookingSession(value: unknown): value is BookingSession {
  return value === "morning" || value === "afternoon" || value === "full_day";
}

function parseAction(value: unknown): CrewBookingAction | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  if (payload.action === "confirm") return { action: "confirm" };
  if (payload.action === "cancel") return { action: "cancel" };
  if (
    payload.action === "reschedule" &&
    typeof payload.date === "string" &&
    isBookingSession(payload.session)
  ) {
    return { action: "reschedule", date: payload.date, session: payload.session };
  }
  return null;
}

async function handleAction(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const headers = responseHeaders();
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "This request could not be accepted." }, { status: 403, headers });
  }

  const session = await getCrewSession();
  if (!session) {
    return NextResponse.json({ message: "Sign in to manage bookings." }, { status: 401, headers });
  }

  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return NextResponse.json({ message: "Send the booking update as JSON." }, { status: 415, headers });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ message: "The request is too large." }, { status: 413, headers });
  }

  let action: CrewBookingAction | null;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ message: "The request is too large." }, { status: 413, headers });
    }
    action = parseAction(JSON.parse(body));
  } catch {
    action = null;
  }

  if (!action) {
    return NextResponse.json({ message: "Choose a valid booking action." }, { status: 400, headers });
  }

  const { id } = await context.params;
  try {
    const updated =
      action.action === "confirm"
        ? await confirmCrewBooking(id)
        : action.action === "cancel"
          ? await cancelCrewBooking(id)
          : await rescheduleCrewBooking(id, action.date, action.session);

    if (!updated) {
      return NextResponse.json(
        { message: "This booking can no longer be changed." },
        { status: 409, headers },
      );
    }

    const message =
      action.action === "confirm"
        ? "Booking confirmed."
        : action.action === "cancel"
          ? "Booking cancelled and the studio time is available again."
          : "Booking moved to the new date and time.";
    return NextResponse.json({ message }, { status: 200, headers });
  } catch (error) {
    const status = error instanceof CrewBookingError && error.kind === "invalid" ? 400 :
      error instanceof CrewBookingError && error.kind === "conflict" ? 409 :
        error instanceof CrewBookingError && error.kind === "configuration" ? 503 : 502;
    return NextResponse.json(
      { message: error instanceof CrewBookingError ? error.message : "The booking could not be updated." },
      { status, headers },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handleAction(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handleAction(request, context);
}
