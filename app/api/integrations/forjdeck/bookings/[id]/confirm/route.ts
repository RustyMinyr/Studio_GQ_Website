import { NextResponse } from "next/server";

import {
  confirmCrewBookingForForjdeck,
  CrewBookingError,
} from "@/lib/crew-bookings";
import { notifyClientOfBookingConfirmation } from "@/lib/booking-email";
import {
  authenticateForjdeckRequest,
  forjdeckResponseHeaders,
} from "@/lib/forjdeck-integration-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 2_048;

type PublicNotification = {
  sent: boolean;
  reason: "sent" | "not_configured" | "missing_recipient" | "failed";
};

function publicNotification(value: {
  sent: boolean;
  reason: string;
}): PublicNotification {
  if (value.sent) return { sent: true, reason: "sent" };
  if (
    value.reason === "not_configured" ||
    value.reason === "missing_recipient"
  ) {
    return { sent: false, reason: value.reason };
  }
  return { sent: false, reason: "failed" };
}

function parseExpectedUpdatedAt(rawBody: string) {
  let value: unknown;
  try {
    value = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const expectedUpdatedAt = (value as Record<string, unknown>).expectedUpdatedAt;
  if (
    typeof expectedUpdatedAt !== "string" ||
    expectedUpdatedAt.length > 40
  ) {
    return null;
  }
  try {
    return new Date(expectedUpdatedAt).toISOString() === expectedUpdatedAt
      ? expectedUpdatedAt
      : null;
  } catch {
    return null;
  }
}

function errorStatus(error: unknown) {
  if (!(error instanceof CrewBookingError)) return 502;
  if (error.kind === "invalid") return 400;
  if (error.kind === "configuration") return 503;
  if (error.kind === "conflict") return 409;
  return 502;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const headers = forjdeckResponseHeaders();
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") ?? "",
    )
  ) {
    return NextResponse.json(
      { message: "Send the booking confirmation as JSON." },
      { status: 415, headers },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (
    !Number.isFinite(declaredLength) ||
    declaredLength < 0 ||
    declaredLength > MAX_BODY_BYTES
  ) {
    return NextResponse.json(
      { message: "The request is too large." },
      { status: 413, headers },
    );
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { message: "The request is too large." },
      { status: 413, headers },
    );
  }

  const authentication = authenticateForjdeckRequest(request, rawBody);
  if (!authentication.ok) {
    return NextResponse.json(
      { message: authentication.message },
      { status: authentication.status, headers },
    );
  }

  const expectedUpdatedAt = parseExpectedUpdatedAt(rawBody);
  if (!expectedUpdatedAt) {
    return NextResponse.json(
      { message: "The booking version is missing or invalid." },
      { status: 400, headers },
    );
  }

  const { id } = await context.params;
  try {
    const result = await confirmCrewBookingForForjdeck(
      id,
      expectedUpdatedAt,
    );

    if (result.outcome === "not_found") {
      return NextResponse.json(
        { message: "The booking could not be found." },
        { status: 404, headers },
      );
    }
    if (result.outcome === "conflict") {
      return NextResponse.json(
        {
          message:
            "This booking changed after it was loaded. Refresh before approving it.",
          booking: result.booking,
        },
        { status: 409, headers },
      );
    }

    if (result.outcome === "already_confirmed") {
      return NextResponse.json(
        {
          booking: result.booking,
          transitioned: false,
          notification: {
            sent: false,
            reason: "already_confirmed",
          },
        },
        { status: 200, headers },
      );
    }

    let notification: PublicNotification = {
      sent: false,
      reason: "missing_recipient",
    };
    try {
      const emailResult = result.emailBooking
        ? await notifyClientOfBookingConfirmation(result.emailBooking)
        : { sent: false, reason: "missing_recipient" };
      notification = publicNotification(emailResult);
    } catch {
      notification = { sent: false, reason: "failed" };
    }

    return NextResponse.json(
      { booking: result.booking, transitioned: true, notification },
      { status: 200, headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof CrewBookingError
            ? error.message
            : "The booking could not be confirmed.",
      },
      { status: errorStatus(error), headers },
    );
  }
}
