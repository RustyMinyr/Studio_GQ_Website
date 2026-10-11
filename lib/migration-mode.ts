import { NextResponse } from "next/server";

export function isMigrationReadOnly() {
  return process.env.MIGRATION_READ_ONLY === "1";
}

/** Block changes before parsing input, reserving slots, or sending email. */
export function migrationFreezeResponse() {
  if (!isMigrationReadOnly()) return null;
  const message = "Studio GQ booking updates are briefly paused for maintenance. Please try again shortly or email bookings@studiogq.co.za.";
  return NextResponse.json({ message, error: message }, {
    status: 503,
    headers: { "Cache-Control": "no-store", "Retry-After": "120", "X-Content-Type-Options": "nosniff" },
  });
}
