import { NextRequest, NextResponse } from "next/server";

import { monthSchema } from "@/lib/booking-schema";
import {
  getOccupiedDates,
  TursoBookingError,
} from "@/lib/turso-bookings";
import { getTursoConfig } from "@/lib/turso";

function currentMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .replace("/", "-");
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    firstDate: `${month}-01`,
    lastDate: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(request: NextRequest) {
  const rawMonth = request.nextUrl.searchParams.get("month") ?? currentMonth();
  const parsedMonth = monthSchema.safeParse(rawMonth);

  if (!parsedMonth.success) {
    return NextResponse.json(
      { message: "Choose a valid calendar month in YYYY-MM format." },
      { status: 400, headers },
    );
  }

  const month = parsedMonth.data;
  const config = getTursoConfig();
  if (!config) {
    return NextResponse.json(
      { configured: false, month, occupied: [] },
      { status: 200, headers },
    );
  }

  const { firstDate, lastDate } = monthBounds(month);
  try {
    const occupied = await getOccupiedDates(config, firstDate, lastDate);
    return NextResponse.json(
      { configured: true, month, occupied },
      { status: 200, headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof TursoBookingError
            ? error.message
            : "Availability could not be loaded.",
        configured: true,
      },
      { status: 502, headers },
    );
  }
}
