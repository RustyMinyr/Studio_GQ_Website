import { NextRequest, NextResponse } from "next/server";
import { migrationFreezeResponse } from "@/lib/migration-mode";

/** Freeze every mutation on the old host throughout the final copy and cutover. */
export function proxy(request: NextRequest) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const frozen = migrationFreezeResponse();
    if (frozen) return frozen;
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
