import type {
  BookingFormData,
  BookingSession,
  ReservableSlot,
} from "@/lib/booking-schema";

const SUPABASE_TIMEOUT_MS = 8_000;

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

type SupabaseErrorPayload = {
  code?: string;
  message?: string;
  details?: string;
};

type SlotRow = {
  booking_date: string;
  slot: ReservableSlot;
};

export type OccupiedDate = {
  date: string;
  slots: ReservableSlot[];
};

export class SupabaseBookingError extends Error {
  constructor(
    message: string,
    readonly kind: "conflict" | "idempotency" | "upstream",
    readonly status?: number,
  ) {
    super(message);
    this.name = "SupabaseBookingError";
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return null;
  } catch {
    return null;
  }

  return { url, serviceRoleKey };
}

function supabaseHeaders(config: SupabaseConfig) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

async function readError(response: Response): Promise<SupabaseErrorPayload> {
  try {
    return (await response.json()) as SupabaseErrorPayload;
  } catch {
    return {};
  }
}

export async function createBooking(
  config: SupabaseConfig,
  booking: BookingFormData,
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${config.url}/rest/v1/rpc/create_studio_booking`, {
      method: "POST",
      headers: supabaseHeaders(config),
      body: JSON.stringify({
        p_request_id: booking.requestId,
        p_booking_date: booking.date,
        p_session: booking.session,
        p_name: booking.name,
        p_company: booking.company || null,
        p_email: booking.email,
        p_phone: booking.phone,
        p_additional_items: booking.additionalItems,
        p_message: booking.message,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    });
  } catch {
    throw new SupabaseBookingError(
      "The booking service is temporarily unavailable.",
      "upstream",
    );
  }

  if (!response.ok) {
    const error = await readError(response);
    if (
      error.message?.includes("request_id_payload_mismatch") ||
      error.message?.includes("request_id_cancelled")
    ) {
      throw new SupabaseBookingError(
        "This booking attempt no longer matches the original request. Please refresh the page and try again.",
        "idempotency",
        response.status,
      );
    }
    if (response.status === 409 || error.code === "23505") {
      throw new SupabaseBookingError(
        "That session has just been booked. Please choose another date or time.",
        "conflict",
        response.status,
      );
    }

    throw new SupabaseBookingError(
      "The booking could not be saved. Please try again.",
      "upstream",
      response.status,
    );
  }

  const result = (await response.json()) as unknown;
  const bookingId =
    typeof result === "string"
      ? result
      : result && typeof result === "object" && "id" in result
        ? String((result as { id: unknown }).id)
        : "";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    throw new SupabaseBookingError(
      "The booking service returned an unexpected response.",
      "upstream",
      response.status,
    );
  }

  return bookingId;
}

export async function getOccupiedDates(
  config: SupabaseConfig,
  firstDate: string,
  lastDate: string,
): Promise<OccupiedDate[]> {
  const query = new URLSearchParams({
    select: "booking_date,slot",
    booking_date: `gte.${firstDate}`,
    order: "booking_date.asc,slot.asc",
  });
  query.append("booking_date", `lte.${lastDate}`);

  let response: Response;
  try {
    response = await fetch(`${config.url}/rest/v1/studio_booking_slots?${query}`, {
      headers: supabaseHeaders(config),
      cache: "no-store",
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    });
  } catch {
    throw new SupabaseBookingError(
      "Availability is temporarily unavailable.",
      "upstream",
    );
  }

  if (!response.ok) {
    throw new SupabaseBookingError(
      "Availability could not be loaded.",
      "upstream",
      response.status,
    );
  }

  const rows = (await response.json()) as SlotRow[];
  const occupied = new Map<string, Set<ReservableSlot>>();

  for (const row of rows) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(row.booking_date) ||
      (row.slot !== "morning" && row.slot !== "afternoon")
    ) {
      continue;
    }
    const slots = occupied.get(row.booking_date) ?? new Set<ReservableSlot>();
    slots.add(row.slot);
    occupied.set(row.booking_date, slots);
  }

  return [...occupied.entries()].map(([date, slots]) => ({
    date,
    slots: [...slots],
  }));
}

export function sessionReservesSlot(
  session: BookingSession,
  occupiedSlots: readonly ReservableSlot[],
) {
  return session === "full_day"
    ? occupiedSlots.length > 0
    : occupiedSlots.includes(session);
}
