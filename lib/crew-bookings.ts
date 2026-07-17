import type { BookingSession } from "@/lib/booking-schema";
import type {
  CrewBooking,
  CrewCalendarBlock,
  CrewCalendarBlockInput,
  CrewClientEmailDraft,
  CrewDashboard,
} from "@/lib/crew-types";

export type {
  CrewBooking,
  CrewBookingKind,
  CrewBookingStatus,
  CrewCalendarBlock,
  CrewCalendarBlockInput,
  CrewClientEmailDraft,
  CrewDashboard,
} from "@/lib/crew-types";

const SUPABASE_TIMEOUT_MS = 8_000;
const CREW_CONTACT_EMAIL = "bookings@studiogq.co.za";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type CrewSupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

type BookingRow = {
  id: string;
  booking_date: string;
  session: BookingSession;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  additional_items: string[] | null;
  message: string;
  price_zar: number;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  hold_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type CalendarBlockRow = {
  id: string;
  booking_date: string;
  session: BookingSession;
  title: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

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

function getCrewSupabaseConfig(): CrewSupabaseConfig {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new CrewBookingError(
      "The crew portal is not connected to Supabase yet.",
      "configuration",
    );
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      throw new Error("Unsupported Supabase URL");
    }
  } catch {
    throw new CrewBookingError(
      "The crew portal Supabase configuration is invalid.",
      "configuration",
    );
  }

  return { url, serviceRoleKey };
}

function headers(config: CrewSupabaseConfig) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

function sessionLabel(session: BookingSession) {
  if (session === "morning") return "Half day · Morning (08:00–12:00)";
  if (session === "afternoon") return "Half day · Afternoon (13:00–17:00)";
  return "Full day · 10 hours";
}

function assertUuid(value: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new CrewBookingError("Choose a valid booking.", "invalid");
  }
}

function assertDate(value: string) {
  if (!DATE_PATTERN.test(value) || Number.isNaN(new Date(`${value}T00:00:00Z`).valueOf())) {
    throw new CrewBookingError("Choose a valid booking date.", "invalid");
  }
}

function assertSession(value: string): asserts value is BookingSession {
  if (value !== "morning" && value !== "afternoon" && value !== "full_day") {
    throw new CrewBookingError("Choose a valid booking session.", "invalid");
  }
}

function normaliseBooking(row: BookingRow): CrewBooking {
  return {
    id: row.id,
    kind: "booking",
    bookingDate: row.booking_date,
    session: row.session,
    status: row.status,
    title: row.name,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    additionalItems: (row.additional_items ?? []) as CrewBooking["additionalItems"],
    message: row.message,
    priceZar: row.price_zar,
    holdExpiresAt: row.hold_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normaliseBlock(row: CalendarBlockRow): CrewCalendarBlock {
  return {
    id: row.id,
    bookingDate: row.booking_date,
    session: row.session,
    title: row.title,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function blockAsCalendarItem(row: CalendarBlockRow): CrewBooking {
  return {
    id: row.id,
    kind: "block",
    bookingDate: row.booking_date,
    session: row.session,
    status: "blocked",
    title: row.title,
    name: null,
    company: null,
    email: null,
    phone: null,
    additionalItems: [],
    message: row.note,
    priceZar: null,
    holdExpiresAt: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const config = getCrewSupabaseConfig();
  let response: Response;

  try {
    response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...init,
      headers: { ...headers(config), ...init?.headers },
      cache: "no-store",
      signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    });
  } catch {
    throw new CrewBookingError(
      "The booking service is temporarily unavailable.",
      "upstream",
    );
  }

  if (!response.ok) {
    let code = "";
    try {
      code = String(((await response.json()) as { code?: string }).code ?? "");
    } catch {
      // Keep the response message intentionally generic for the crew UI.
    }
    throw new CrewBookingError(
      code === "23505"
        ? "That session is no longer available. Choose another time."
        : "The booking service could not complete that request.",
      code === "23505" ? "conflict" : "upstream",
      response.status,
    );
  }

  return (await response.json()) as T;
}

async function runRpc<T>(name: string, body: Record<string, unknown>) {
  return requestJson<T>(`rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function releaseExpiredHolds() {
  await runRpc<number>("expire_studio_booking_holds", {});
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

const bookingSelect = [
  "id",
  "booking_date",
  "session",
  "name",
  "company",
  "email",
  "phone",
  "additional_items",
  "message",
  "price_zar",
  "status",
  "hold_expires_at",
  "created_at",
  "updated_at",
].join(",");

/** Summary data for the simple shared crew dashboard. */
export async function getCrewDashboard(): Promise<CrewDashboard> {
  await releaseExpiredHolds();

  const today = todayInJohannesburg();
  const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const [pending, confirmed, expiring, upcoming] = await Promise.all([
    requestJson<BookingRow[]>(
      `studio_bookings?select=id&status=eq.pending&order=created_at.asc`,
    ),
    requestJson<BookingRow[]>(
      `studio_bookings?select=id&status=eq.confirmed&order=booking_date.asc`,
    ),
    requestJson<BookingRow[]>(
      `studio_bookings?select=id&status=eq.pending&hold_expires_at=lte.${encodeURIComponent(oneDayFromNow)}&order=hold_expires_at.asc`,
    ),
    requestJson<BookingRow[]>(
      `studio_bookings?select=${bookingSelect}&booking_date=gte.${today}&status=in.(pending,confirmed)&order=booking_date.asc,created_at.asc&limit=8`,
    ),
  ]);

  return {
    pendingCount: pending.length,
    confirmedCount: confirmed.length,
    holdsExpiringCount: expiring.length,
    upcomingBookings: upcoming.map(normaliseBooking),
  };
}

/** Active bookings and internal blocks for a single calendar month. */
export async function getCrewCalendar(
  year: number,
  month: number,
): Promise<CrewBooking[]> {
  if (!Number.isInteger(year) || year < 2000 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new CrewBookingError("Choose a valid calendar month.", "invalid");
  }

  await releaseExpiredHolds();

  const firstDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDate = `${year}-${String(month).padStart(2, "0")}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
  const range = `booking_date=gte.${firstDate}&booking_date=lte.${lastDate}`;
  const [bookings, blocks] = await Promise.all([
    requestJson<BookingRow[]>(
      `studio_bookings?select=${bookingSelect}&${range}&status=in.(pending,confirmed)&order=booking_date.asc,created_at.asc`,
    ),
    requestJson<CalendarBlockRow[]>(
      `studio_calendar_blocks?select=id,booking_date,session,title,note,created_at,updated_at&${range}&order=booking_date.asc,created_at.asc`,
    ),
  ]);

  return [...bookings.map(normaliseBooking), ...blocks.map(blockAsCalendarItem)].sort(
    (left, right) =>
      left.bookingDate.localeCompare(right.bookingDate) ||
      left.createdAt.localeCompare(right.createdAt),
  );
}

/** Internal block data for a future calendar treatment. Blocks reserve slots but are not client bookings. */
export async function getCrewCalendarBlocks(
  year: number,
  month: number,
): Promise<CrewCalendarBlock[]> {
  if (!Number.isInteger(year) || year < 2000 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new CrewBookingError("Choose a valid calendar month.", "invalid");
  }

  const firstDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDate = `${year}-${String(month).padStart(2, "0")}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
  return requestJson<CalendarBlockRow[]>(
    `studio_calendar_blocks?select=id,booking_date,session,title,note,created_at,updated_at&booking_date=gte.${firstDate}&booking_date=lte.${lastDate}&order=booking_date.asc,created_at.asc`,
  ).then((blocks) => blocks.map(normaliseBlock));
}

/** A complete client booking record for the booking drawer/detail screen. */
export async function getCrewBooking(id: string): Promise<CrewBooking | null> {
  assertUuid(id);
  await releaseExpiredHolds();

  const rows = await requestJson<BookingRow[]>(
    `studio_bookings?select=${bookingSelect}&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  return rows[0] ? normaliseBooking(rows[0]) : null;
}

export async function confirmCrewBooking(id: string): Promise<boolean> {
  assertUuid(id);
  return runRpc<boolean>("confirm_studio_booking", { p_booking_id: id });
}

export async function cancelCrewBooking(id: string): Promise<boolean> {
  assertUuid(id);
  return runRpc<boolean>("cancel_studio_booking", { p_booking_id: id });
}

export async function rescheduleCrewBooking(
  id: string,
  bookingDate: string,
  session: BookingSession,
): Promise<boolean> {
  assertUuid(id);
  assertDate(bookingDate);
  assertSession(session);
  return runRpc<boolean>("reschedule_studio_booking", {
    p_booking_id: id,
    p_booking_date: bookingDate,
    p_session: session,
  });
}

export async function createCrewCalendarBlock(
  input: CrewCalendarBlockInput,
): Promise<string> {
  assertDate(input.bookingDate);
  assertSession(input.session);
  const title = input.title.trim();
  const note = input.note?.trim() || null;
  if (title.length < 2 || title.length > 100 || (note && note.length > 1000)) {
    throw new CrewBookingError("Enter a shorter block title or note.", "invalid");
  }

  return runRpc<string>("create_studio_calendar_block", {
    p_booking_date: input.bookingDate,
    p_session: input.session,
    p_title: title,
    p_note: note,
  });
}

export async function rescheduleCrewCalendarBlock(
  id: string,
  input: CrewCalendarBlockInput,
): Promise<boolean> {
  assertUuid(id);
  assertDate(input.bookingDate);
  assertSession(input.session);
  const title = input.title.trim();
  const note = input.note?.trim() || null;
  if (title.length < 2 || title.length > 100 || (note && note.length > 1000)) {
    throw new CrewBookingError("Enter a shorter block title or note.", "invalid");
  }

  return runRpc<boolean>("reschedule_studio_calendar_block", {
    p_block_id: id,
    p_booking_date: input.bookingDate,
    p_session: input.session,
    p_title: title,
    p_note: note,
  });
}

export async function cancelCrewCalendarBlock(id: string): Promise<boolean> {
  assertUuid(id);
  return runRpc<boolean>("cancel_studio_calendar_block", { p_block_id: id });
}

/** A ready-to-open mail draft; the crew still sends it from the shared inbox. */
export function createClientEmailDraft(
  booking: CrewBooking,
): CrewClientEmailDraft {
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
