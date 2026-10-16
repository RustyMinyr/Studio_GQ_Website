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
    const imageCommit = process.env.IMAGE_SOURCE_COMMIT;
    const commit = imageCommit && imageCommit !== "unknown"
      ? imageCommit
      : process.env.SOURCE_COMMIT ?? "unknown";
    return NextResponse.json({ status: "ok", commit }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  } finally { client.close(); }
}
