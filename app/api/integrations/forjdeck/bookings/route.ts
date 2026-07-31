import { NextResponse } from "next/server";

import {
  CrewBookingError,
  getForjdeckBookingYear,
} from "@/lib/crew-bookings";
import {
  authenticateForjdeckRequest,
  forjdeckResponseHeaders,
} from "@/lib/forjdeck-integration-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function errorStatus(error: unknown) {
  if (!(error instanceof CrewBookingError)) return 502;
  if (error.kind === "invalid") return 400;
  if (error.kind === "configuration") return 503;
  if (error.kind === "conflict") return 409;
  return 502;
}

export async function GET(request: Request) {
  const headers = forjdeckResponseHeaders();
  const authentication = authenticateForjdeckRequest(request, "");
  if (!authentication.ok) {
    return NextResponse.json(
      { message: authentication.message },
      { status: authentication.status, headers },
    );
  }

  const yearValue = new URL(request.url).searchParams.get("year") ?? "";
  if (!/^\d{4}$/.test(yearValue)) {
    return NextResponse.json(
      { message: "Choose a valid calendar year." },
      { status: 400, headers },
    );
  }

  try {
    const calendar = await getForjdeckBookingYear(Number(yearValue));
    return NextResponse.json(calendar, { status: 200, headers });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof CrewBookingError
            ? error.message
            : "The booking calendar could not be loaded.",
      },
      { status: errorStatus(error), headers },
    );
  }
}
