import { createClient } from "@tursodatabase/serverless/compat";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
if (!url || !authToken) throw new Error("Turso credentials are not configured.");

const client = createClient({ url, authToken });
try {
  const tables = await client.execute(
    "select name from sqlite_master where type = 'table' and name in ('studio_booking_groups', 'studio_bookings', 'studio_booking_slots', 'studio_calendar_blocks') order by name",
  );
  const availability = await client.execute("select count(*) as count from studio_booking_slots");
  console.log(`Tables: ${tables.rows.map((row) => row.name).join(', ')}`);
  console.log(`Reserved slots: ${availability.rows[0]?.count ?? 0}`);
} finally {
  client.close();
}
