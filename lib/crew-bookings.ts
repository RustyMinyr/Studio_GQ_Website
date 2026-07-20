import { randomUUID } from "node:crypto";

import type { Row, Transaction } from "@tursodatabase/serverless/compat";

import type { BookingSession } from "@/lib/booking-schema";
import type {
  CrewBooking,
  CrewCalendarBlock,
  CrewCalendarBlockInput,
  CrewClientEmailDraft,
  CrewDashboard,
} from "@/lib/crew-types";
import { getTursoClient, getTursoConfig, type TursoConfig } from "@/lib/turso";

export type {
  CrewBooking,
  CrewBookingKind,
  CrewBookingStatus,
  CrewCalendarBlock,
  CrewCalendarBlockInput,
  CrewClientEmailDraft,
  CrewDashboard,
} from "@/lib/crew-types";

const CREW_CONTACT_EMAIL = "bookings@studiogq.co.za";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class CrewBookingError extends Error {
  constructor(
    message: string,
    readonly kind: "configuration" | "invalid" | "conflict" | "upstream",
    readonly status?: number,
  ) {
    super(message);
    this.name = "CrewBookingError";
  }
}

function requireConfig(): TursoConfig {
  const config = getTursoConfig();
  if (!config) {
    throw new CrewBookingError(
      "The crew portal is not connected to Turso yet.",
      "configuration",
    );
  }
  return config;
}

function sessionLabel(session: BookingSession) {
  if (session === "morning") return "Half day · Morning (08:00–12:00)";
  if (session === "afternoon") return "Half day · Afternoon (13:00–17:00)";
  return "Full day · 10 hours";
}

function slotsForSession(session: BookingSession) {
  return session === "full_day" ? ["morning", "afternoon"] : [session];
}

function nowIso() {
  return new Date().toISOString();
}

function todayInJohannesburg() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function assertUuid(value: string) {
  if (!UUID_PATTERN.test(value)) throw new CrewBookingError("Choose a valid booking.", "invalid");
}

function assertDate(value: string) {
  if (!DATE_PATTERN.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new CrewBookingError("Choose a valid booking date.", "invalid");
  }
}

function assertFutureOrToday(value: string, label: string) {
  assertDate(value);
  if (value < todayInJohannesburg()) {
    throw new CrewBookingError(`${label} date cannot be in the past.`, "invalid");
  }
}

function assertSession(value: string): asserts value is BookingSession {
  if (value !== "morning" && value !== "afternoon" && value !== "full_day") {
    throw new CrewBookingError("Choose a valid booking session.", "invalid");
  }
}

function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function nullableText(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

function parseItems(value: unknown): CrewBooking["additionalItems"] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") as CrewBooking["additionalItems"] : [];
  } catch {
    return [];
  }
}

function normaliseBooking(row: Row): CrewBooking {
  return {
    id: text(row, "id"),
    kind: "booking",
    bookingDate: text(row, "booking_date"),
    session: text(row, "session") as BookingSession,
    status: text(row, "status") as CrewBooking["status"],
    title: text(row, "name"),
    name: nullableText(row, "name"),
    company: nullableText(row, "company"),
    email: nullableText(row, "email"),
    phone: nullableText(row, "phone"),
    additionalItems: parseItems(row.additional_items),
    message: nullableText(row, "message"),
    priceZar: typeof row.price_zar === "number" ? row.price_zar : null,
    holdExpiresAt: nullableText(row, "hold_expires_at"),
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at"),
  };
}

function normaliseBlock(row: Row): CrewCalendarBlock {
  return {
    id: text(row, "id"),
    bookingDate: text(row, "booking_date"),
    session: text(row, "session") as BookingSession,
    title: text(row, "title"),
    note: nullableText(row, "note"),
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at"),
  };
}

function blockAsCalendarItem(row: Row): CrewBooking {
  const block = normaliseBlock(row);
  return {
    id: block.id,
    kind: "block",
    bookingDate: block.bookingDate,
    session: block.session,
    status: "blocked",
    title: block.title,
    name: null,
    company: null,
    email: null,
    phone: null,
    additionalItems: [],
    message: block.note,
    priceZar: null,
    holdExpiresAt: null,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  };
}

function isConstraintError(error: unknown) {
  const candidate = error as { code?: unknown; extendedCode?: unknown; message?: unknown };
  return [candidate?.code, candidate?.extendedCode, candidate?.message]
    .map((value) => String(value ?? ""))
    .some((value) => /constraint|unique/i.test(value));
}

async function rollbackQuietly(transaction: Transaction) {
  if (!transaction.closed) {
    try {
      await transaction.rollback();
    } catch {
      // The original error is the useful one for the caller.
    }
  }
}

async function releaseExpiredHolds(config: TursoConfig) {
  const client = getTursoClient(config);
  try {
    const now = nowIso();
    await client.batch([
      { sql: "update studio_bookings set status = 'expired', hold_expires_at = null, updated_at = ? where status = 'pending' and hold_expires_at <= ?", args: [now, now] },
      { sql: "delete from studio_booking_slots where booking_id in (select id from studio_bookings where status = 'expired')" },
    ], "write");
  } finally {
    client.close();
  }
}

const bookingColumns = "id, booking_date, session, name, company, email, phone, additional_items, message, price_zar, status, hold_expires_at, created_at, updated_at";

export async function getCrewDashboard(): Promise<CrewDashboard> {
  const config = requireConfig();
  await releaseExpiredHolds(config);
  const client = getTursoClient(config);
  try {
    const today = todayInJohannesburg();
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const [pending, confirmed, expiring, upcoming] = await Promise.all([
      client.execute("select count(*) as count from studio_bookings where status = 'pending'"),
      client.execute("select count(*) as count from studio_bookings where status = 'confirmed'"),
      client.execute({ sql: "select count(*) as count from studio_bookings where status = 'pending' and hold_expires_at <= ?", args: [oneDayFromNow] }),
      client.execute({ sql: `select ${bookingColumns} from studio_bookings where booking_date >= ? and status in ('pending', 'confirmed') order by booking_date asc, created_at asc limit 8`, args: [today] }),
    ]);
    return {
      pendingCount: Number(pending.rows[0]?.count ?? 0),
      confirmedCount: Number(confirmed.rows[0]?.count ?? 0),
      holdsExpiringCount: Number(expiring.rows[0]?.count ?? 0),
      upcomingBookings: upcoming.rows.map(normaliseBooking),
    };
  } catch {
    throw new CrewBookingError("The booking service is temporarily unavailable.", "upstream");
  } finally {
    client.close();
  }
}

function monthRange(year: number, month: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new CrewBookingError("Choose a valid calendar month.", "invalid");
  }
  const firstDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDate = `${year}-${String(month).padStart(2, "0")}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
  return { firstDate, lastDate };
}

export async function getCrewCalendar(year: number, month: number): Promise<CrewBooking[]> {
  const { firstDate, lastDate } = monthRange(year, month);
  const config = requireConfig();
  await releaseExpiredHolds(config);
  const client = getTursoClient(config);
  try {
    const [bookings, blocks] = await Promise.all([
      client.execute({ sql: `select ${bookingColumns} from studio_bookings where booking_date between ? and ? and status in ('pending', 'confirmed') order by booking_date asc, created_at asc`, args: [firstDate, lastDate] }),
      client.execute({ sql: "select id, booking_date, session, title, note, created_at, updated_at from studio_calendar_blocks where booking_date between ? and ? order by booking_date asc, created_at asc", args: [firstDate, lastDate] }),
    ]);
    return [...bookings.rows.map(normaliseBooking), ...blocks.rows.map(blockAsCalendarItem)].sort(
      (left, right) => left.bookingDate.localeCompare(right.bookingDate) || left.createdAt.localeCompare(right.createdAt),
    );
  } catch {
    throw new CrewBookingError("The booking service is temporarily unavailable.", "upstream");
  } finally {
    client.close();
  }
}

export async function getCrewCalendarBlocks(year: number, month: number): Promise<CrewCalendarBlock[]> {
  const { firstDate, lastDate } = monthRange(year, month);
  const client = getTursoClient(requireConfig());
  try {
    const blocks = await client.execute({ sql: "select id, booking_date, session, title, note, created_at, updated_at from studio_calendar_blocks where booking_date between ? and ? order by booking_date asc, created_at asc", args: [firstDate, lastDate] });
    return blocks.rows.map(normaliseBlock);
  } catch {
    throw new CrewBookingError("The booking service is temporarily unavailable.", "upstream");
  } finally {
    client.close();
  }
}

export async function getCrewBooking(id: string): Promise<CrewBooking | null> {
  assertUuid(id);
  const config = requireConfig();
  await releaseExpiredHolds(config);
  const client = getTursoClient(config);
  try {
    const result = await client.execute({ sql: `select ${bookingColumns} from studio_bookings where id = ? limit 1`, args: [id] });
    return result.rows[0] ? normaliseBooking(result.rows[0]) : null;
  } catch {
    throw new CrewBookingError("The booking service is temporarily unavailable.", "upstream");
  } finally {
    client.close();
  }
}

export async function confirmCrewBooking(id: string): Promise<boolean> {
  assertUuid(id);
  const config = requireConfig();
  await releaseExpiredHolds(config);
  const client = getTursoClient(config);
  try {
    const current = await client.execute({ sql: "select status from studio_bookings where id = ? limit 1", args: [id] });
    const status = current.rows[0]?.status;
    if (status === "confirmed") return true;
    if (status !== "pending") return false;
    const result = await client.execute({ sql: "update studio_bookings set status = 'confirmed', hold_expires_at = null, updated_at = ? where id = ? and status = 'pending'", args: [nowIso(), id] });
    return result.rowsAffected === 1;
  } finally {
    client.close();
  }
}

export async function cancelCrewBooking(id: string): Promise<boolean> {
  assertUuid(id);
  const client = getTursoClient(requireConfig());
  const transaction = await client.transaction("write");
  try {
    const current = await transaction.execute({ sql: "select status from studio_bookings where id = ? limit 1", args: [id] });
    const status = current.rows[0]?.status;
    if (status === "cancelled") {
      await transaction.commit();
      return true;
    }
    if (status !== "pending" && status !== "confirmed") {
      await transaction.commit();
      return false;
    }
    await transaction.execute({ sql: "update studio_bookings set status = 'cancelled', hold_expires_at = null, updated_at = ? where id = ?", args: [nowIso(), id] });
    await transaction.execute({ sql: "delete from studio_booking_slots where booking_id = ?", args: [id] });
    await transaction.commit();
    return true;
  } catch (error) {
    await rollbackQuietly(transaction);
    throw new CrewBookingError("The booking service could not complete that request.", "upstream");
  } finally {
    client.close();
  }
}

async function replaceBookingSlots(transaction: Transaction, bookingId: string, bookingDate: string, session: BookingSession) {
  await transaction.execute({ sql: "delete from studio_booking_slots where booking_id = ?", args: [bookingId] });
  for (const slot of slotsForSession(session)) {
    await transaction.execute({ sql: "insert into studio_booking_slots (booking_id, booking_date, slot, created_at) values (?, ?, ?, ?)", args: [bookingId, bookingDate, slot, nowIso()] });
  }
}

export async function rescheduleCrewBooking(id: string, bookingDate: string, session: BookingSession): Promise<boolean> {
  assertUuid(id);
  assertFutureOrToday(bookingDate, "Booking");
  assertSession(session);
  const config = requireConfig();
  await releaseExpiredHolds(config);
  const client = getTursoClient(config);
  const transaction = await client.transaction("write");
  try {
    const current = await transaction.execute({ sql: "select status from studio_bookings where id = ? limit 1", args: [id] });
    if (current.rows[0]?.status !== "pending" && current.rows[0]?.status !== "confirmed") {
      await transaction.commit();
      return false;
    }
    await replaceBookingSlots(transaction, id, bookingDate, session);
    await transaction.execute({ sql: "update studio_bookings set booking_date = ?, session = ?, price_zar = ?, updated_at = ? where id = ?", args: [bookingDate, session, session === "full_day" ? 4500 : 2500, nowIso(), id] });
    await transaction.commit();
    return true;
  } catch (error) {
    await rollbackQuietly(transaction);
    if (isConstraintError(error)) throw new CrewBookingError("That session is no longer available. Choose another time.", "conflict");
    throw new CrewBookingError("The booking service could not complete that request.", "upstream");
  } finally {
    client.close();
  }
}

function validateBlock(input: CrewCalendarBlockInput) {
  assertFutureOrToday(input.bookingDate, "Block");
  assertSession(input.session);
  const title = input.title.trim();
  const note = input.note?.trim() || null;
  if (title.length < 2 || title.length > 100 || (note && note.length > 1000)) {
    throw new CrewBookingError("Enter a shorter block title or note.", "invalid");
  }
  return { title, note };
}

async function replaceBlockSlots(transaction: Transaction, blockId: string, bookingDate: string, session: BookingSession) {
  await transaction.execute({ sql: "delete from studio_booking_slots where block_id = ?", args: [blockId] });
  for (const slot of slotsForSession(session)) {
    await transaction.execute({ sql: "insert into studio_booking_slots (block_id, booking_date, slot, created_at) values (?, ?, ?, ?)", args: [blockId, bookingDate, slot, nowIso()] });
  }
}

export async function createCrewCalendarBlock(input: CrewCalendarBlockInput): Promise<string> {
  const { title, note } = validateBlock(input);
  const client = getTursoClient(requireConfig());
  const transaction = await client.transaction("write");
  const id = randomUUID();
  const createdAt = nowIso();
  try {
    await transaction.execute({ sql: "insert into studio_calendar_blocks (id, booking_date, session, title, note, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)", args: [id, input.bookingDate, input.session, title, note, createdAt, createdAt] });
    await replaceBlockSlots(transaction, id, input.bookingDate, input.session);
    await transaction.commit();
    return id;
  } catch (error) {
    await rollbackQuietly(transaction);
    if (isConstraintError(error)) throw new CrewBookingError("That session is no longer available. Choose another time.", "conflict");
    throw new CrewBookingError("The booking service could not complete that request.", "upstream");
  } finally {
    client.close();
  }
}

export async function rescheduleCrewCalendarBlock(id: string, input: CrewCalendarBlockInput): Promise<boolean> {
  assertUuid(id);
  const { title, note } = validateBlock(input);
  const client = getTursoClient(requireConfig());
  const transaction = await client.transaction("write");
  try {
    const current = await transaction.execute({ sql: "select id from studio_calendar_blocks where id = ? limit 1", args: [id] });
    if (!current.rows[0]) {
      await transaction.commit();
      return false;
    }
    await replaceBlockSlots(transaction, id, input.bookingDate, input.session);
    await transaction.execute({ sql: "update studio_calendar_blocks set booking_date = ?, session = ?, title = ?, note = ?, updated_at = ? where id = ?", args: [input.bookingDate, input.session, title, note, nowIso(), id] });
    await transaction.commit();
    return true;
  } catch (error) {
    await rollbackQuietly(transaction);
    if (isConstraintError(error)) throw new CrewBookingError("That session is no longer available. Choose another time.", "conflict");
    throw new CrewBookingError("The booking service could not complete that request.", "upstream");
  } finally {
    client.close();
  }
}

export async function cancelCrewCalendarBlock(id: string): Promise<boolean> {
  assertUuid(id);
  const client = getTursoClient(requireConfig());
  const transaction = await client.transaction("write");
  try {
    const result = await transaction.execute({ sql: "delete from studio_calendar_blocks where id = ?", args: [id] });
    await transaction.commit();
    return result.rowsAffected === 1;
  } catch {
    await rollbackQuietly(transaction);
    throw new CrewBookingError("The booking service could not complete that request.", "upstream");
  } finally {
    client.close();
  }
}

export function createClientEmailDraft(booking: CrewBooking): CrewClientEmailDraft {
  if (booking.kind !== "booking" || !booking.email || !booking.name) {
    throw new CrewBookingError("Only client bookings can receive email.", "invalid");
  }
  const subject = `Studio GQ booking — ${booking.bookingDate}`;
  const body = [
    `Hi ${booking.name},`,
    "",
    "Thank you for your Studio GQ booking enquiry.",
    "",
    `Requested session: ${booking.bookingDate} — ${sessionLabel(booking.session)}`,
    `Booking status: ${booking.status}`,
    "",
    "Please let us know if you have any questions or changes before we finalise the booking.",
    "",
    "Kind regards,",
    "Studio GQ",
    CREW_CONTACT_EMAIL,
  ].join("\n");
  return {
    to: booking.email,
    subject,
    body,
    mailto: `mailto:${encodeURIComponent(booking.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}
