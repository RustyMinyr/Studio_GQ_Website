import { createHash, randomUUID } from "node:crypto";

import type { Transaction } from "@tursodatabase/serverless/compat";

import type {
  BookingFormData,
  BookingSession,
  ReservableSlot,
} from "@/lib/booking-schema";
import { getTursoClient, type TursoConfig } from "@/lib/turso";

export type OccupiedDate = {
  date: string;
  slots: ReservableSlot[];
};

export class TursoBookingError extends Error {
  constructor(
    message: string,
    readonly kind: "conflict" | "idempotency" | "upstream",
    readonly status?: number,
  ) {
    super(message);
    this.name = "TursoBookingError";
  }
}

function slotsForSession(session: BookingSession): ReservableSlot[] {
  if (session === "full_day") return ["morning", "afternoon"];
  return [session];
}

function normalisedPayload(booking: BookingFormData) {
  return JSON.stringify({
    dates: [...booking.dates].sort(),
    session: booking.session,
    name: booking.name.trim(),
    company: booking.company?.trim() || null,
    email: booking.email.trim().toLowerCase(),
    phone: booking.phone.trim(),
    additionalItems: [...booking.additionalItems].sort(),
    message: booking.message.trim(),
  });
}

function payloadHash(booking: BookingFormData) {
  return createHash("sha256").update(normalisedPayload(booking)).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function holdExpiryIso() {
  return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
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
      // The original transaction error remains the useful error for the caller.
    }
  }
}

/** Creates a single idempotent, all-or-nothing reservation covering every selected day. */
export async function createBooking(
  config: TursoConfig,
  booking: BookingFormData,
): Promise<string> {
  const client = getTursoClient(config);
  const transaction = await client.transaction("write");
  const requestHash = payloadHash(booking);

  try {
    const now = nowIso();
    await transaction.execute({
      sql: "update studio_bookings set status = 'expired', hold_expires_at = null, updated_at = ? where status = 'pending' and hold_expires_at <= ?",
      args: [now, now],
    });
    await transaction.execute({
      sql: "delete from studio_booking_slots where booking_id in (select id from studio_bookings where status = 'expired')",
    });

    const existing = await transaction.execute({
      sql: "select id, payload_hash from studio_booking_groups where request_id = ? limit 1",
      args: [booking.requestId],
    });
    const existingId = existing.rows[0]?.id;
    if (typeof existingId === "string") {
      if (existing.rows[0]?.payload_hash !== requestHash) {
        throw new TursoBookingError(
          "This booking attempt no longer matches the original request. Please refresh the page and try again.",
          "idempotency",
        );
      }

      const active = await transaction.execute({
        sql: "select count(*) as count from studio_bookings where booking_group_id = ? and status in ('pending', 'confirmed')",
        args: [existingId],
      });
      if (Number(active.rows[0]?.count ?? 0) === 0) {
        throw new TursoBookingError(
          "This booking request is no longer active. Please start a new booking.",
          "idempotency",
        );
      }
      await transaction.commit();
      return existingId;
    }

    const groupId = randomUUID();
    const createdAt = nowIso();
    const priceZar = booking.session === "full_day" ? 4500 : 2500;
    const company = booking.company?.trim() || null;
    const additionalItems = JSON.stringify([...booking.additionalItems].sort());
    const holdExpiresAt = holdExpiryIso();

    await transaction.execute({
      sql: "insert into studio_booking_groups (id, request_id, payload_hash, created_at) values (?, ?, ?, ?)",
      args: [groupId, booking.requestId, requestHash, createdAt],
    });

    for (const bookingDate of booking.dates) {
      const bookingId = randomUUID();
      await transaction.execute({
        sql: "insert into studio_bookings (id, booking_group_id, booking_date, session, name, company, email, phone, additional_items, message, price_zar, status, hold_expires_at, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
        args: [
          bookingId,
          groupId,
          bookingDate,
          booking.session,
          booking.name.trim(),
          company,
          booking.email.trim().toLowerCase(),
          booking.phone.trim(),
          additionalItems,
          booking.message.trim(),
          priceZar,
          holdExpiresAt,
          createdAt,
          createdAt,
        ],
      });

      for (const slot of slotsForSession(booking.session)) {
        await transaction.execute({
          sql: "insert into studio_booking_slots (booking_id, booking_date, slot, created_at) values (?, ?, ?, ?)",
          args: [bookingId, bookingDate, slot, createdAt],
        });
      }
    }

    await transaction.commit();
    return groupId;
  } catch (error) {
    await rollbackQuietly(transaction);
    if (error instanceof TursoBookingError) throw error;
    if (isConstraintError(error)) {
      throw new TursoBookingError(
        "That session has just been booked. Please choose another date or time.",
        "conflict",
      );
    }
    throw new TursoBookingError("The booking service is temporarily unavailable.", "upstream");
  } finally {
    client.close();
  }
}

export async function getOccupiedDates(
  config: TursoConfig,
  firstDate: string,
  lastDate: string,
): Promise<OccupiedDate[]> {
  const client = getTursoClient(config);
  try {
    const result = await client.execute({
      sql: "select booking_date, slot from studio_booking_slots where booking_date >= ? and booking_date <= ? order by booking_date asc, slot asc",
      args: [firstDate, lastDate],
    });
    const occupied = new Map<string, Set<ReservableSlot>>();
    for (const row of result.rows) {
      const date = row.booking_date;
      const slot = row.slot;
      if (typeof date !== "string" || (slot !== "morning" && slot !== "afternoon")) continue;
      const slots = occupied.get(date) ?? new Set<ReservableSlot>();
      slots.add(slot);
      occupied.set(date, slots);
    }
    return [...occupied.entries()].map(([date, slots]) => ({ date, slots: [...slots] }));
  } catch {
    throw new TursoBookingError("Availability could not be loaded.", "upstream");
  } finally {
    client.close();
  }
}

export function sessionReservesSlot(
  session: BookingSession,
  occupiedSlots: readonly ReservableSlot[],
) {
  return session === "full_day"
    ? occupiedSlots.length > 0
    : occupiedSlots.includes(session);
}
