import { NextRequest, NextResponse } from "next/server";

/** Freeze every mutation on the old host throughout the final copy and cutover. */
export function proxy(request: NextRequest) {
  if (process.env.MIGRATION_READ_ONLY === "1" && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return NextResponse.json({ message: "Bookings are briefly paused for maintenance. Please try again shortly." }, {
      status: 503, headers: { "Retry-After": "300", "Cache-Control": "no-store" },
    });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
