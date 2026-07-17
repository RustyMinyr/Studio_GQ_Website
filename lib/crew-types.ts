import type { AdditionalItem, BookingSession } from "@/lib/booking-schema";

export type CrewBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "expired"
  | "blocked";

export type CrewBookingKind = "booking" | "block";

/**
 * A single item displayed in the shared crew calendar. Calendar blocks use
 * `kind: "block"` and intentionally omit client-only fields.
 */
export type CrewBooking = {
  id: string;
  kind: CrewBookingKind;
  bookingDate: string;
  session: BookingSession;
  status: CrewBookingStatus;
  title: string;
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  additionalItems: AdditionalItem[];
  message: string | null;
  priceZar: number | null;
  holdExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrewCalendarBlock = {
  id: string;
  bookingDate: string;
  session: BookingSession;
  title: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrewDashboard = {
  pendingCount: number;
  confirmedCount: number;
  holdsExpiringCount: number;
  upcomingBookings: CrewBooking[];
};

export type CrewClientEmailDraft = {
  to: string;
  subject: string;
  body: string;
  mailto: string;
};

export type CrewCalendarBlockInput = {
  bookingDate: string;
  session: BookingSession;
  title: string;
  note?: string;
};
