import { NextRequest, NextResponse } from "next/server";

import {
  cancelCrewBooking,
  confirmCrewBooking,
  CrewBookingError,
  getCrewBooking,
  rescheduleCrewBooking,
} from "@/lib/crew-bookings";
import { getCrewSession } from "@/lib/crew-auth";
import {
  type BookingQuoteAttachment,
  notifyClientOfBookingConfirmation,
} from "@/lib/booking-email";
import type { BookingSession } from "@/lib/booking-schema";

const MAX_BODY_BYTES = 4_200_000;
const MAX_QUOTE_BYTES = 3 * 1024 * 1024;
const PDF_BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

type CrewBookingAction =
  | { action: "confirm"; note?: string; quote?: BookingQuoteAttachment }
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

function parseQuote(value: unknown): BookingQuoteAttachment | null | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object") return null;
  const quote = value as Record<string, unknown>;
  if (typeof quote.filename !== "string" || typeof quote.content !== "string") return null;
  const filename = quote.filename.trim();
  const content = quote.content.trim();
  const byteLength = Math.floor((content.length * 3) / 4) - (content.endsWith("==") ? 2 : content.endsWith("=") ? 1 : 0);
  if (
    !filename.toLowerCase().endsWith(".pdf") ||
    filename.length < 5 ||
    filename.length > 180 ||
    !PDF_BASE64_PATTERN.test(content) ||
    byteLength < 1 ||
    byteLength > MAX_QUOTE_BYTES
  ) {
    return null;
  }
  return { filename, content };
}

function parseAction(value: unknown): CrewBookingAction | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  if (payload.action === "confirm") {
    const note = typeof payload.note === "string" ? payload.note.trim() : undefined;
    const quote = parseQuote(payload.quote);
    if ((note && note.length > 2_000) || quote === null) return null;
    return { action: "confirm", note, quote };
  }
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

    if (action.action === "confirm") {
      let notification: { sent: boolean; reason: string } = {
        sent: false,
        reason: "missing_recipient",
      };
      try {
        const booking = await getCrewBooking(id);
        notification = booking
          ? await notifyClientOfBookingConfirmation(booking, action.note, action.quote)
          : notification;
      } catch {
        notification = { sent: false, reason: "failed" };
      }
      const message = notification.sent
        ? "Booking confirmed. A confirmation email was sent to the client and copied to bookings@studiogq.co.za."
        : "Booking confirmed, but the confirmation email could not be sent. Check the Resend email settings.";
      return NextResponse.json(
        { message, emailStatus: notification.reason },
        { status: 200, headers },
      );
    }

    const message = action.action === "cancel"
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
