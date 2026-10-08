import { NextResponse } from "next/server";
import { getTursoClient, getTursoConfig } from "@/lib/turso";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const config = getTursoConfig();
  if (!config) return NextResponse.json({ status: "unavailable" }, { status: 503 });
  const client = getTursoClient(config);
  try {
    await client.execute("select id from studio_bookings limit 1");
    return NextResponse.json({ status: "ok", commit: process.env.SOURCE_COMMIT ?? "unknown" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  } finally { client.close(); }
}
