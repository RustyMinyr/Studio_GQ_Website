import type { CrewBooking } from "@/lib/crew-types";
import { additionalItemOptions } from "@/lib/booking-schema";

export const statusLabels: Record<CrewBooking["status"], string> = {
  pending: "Awaiting review",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  expired: "Expired",
  blocked: "Studio blocked",
};

export const statusStyles: Record<CrewBooking["status"], string> = {
  pending: "border-[#c4a15a] text-[#7b5a18] bg-[#fff7e4]",
  confirmed: "border-[#557967] text-[#31513f] bg-[#eef7f0]",
  cancelled: "border-[#a7a7a3] text-[#565656] bg-[#f1f1ee]",
  expired: "border-[#a7a7a3] text-[#565656] bg-[#f1f1ee]",
  blocked: "border-[#565656] text-[#303030] bg-[#e7e7e4]",
};

export function formatBookingDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatBookingTime(session: CrewBooking["session"]) {
  if (session === "morning") return "Morning · 08:00–12:00";
  if (session === "afternoon") return "Afternoon · 13:00–17:00";
  return "Full day · 10 hours";
}

export function formatPrice(price: number | null | undefined) {
  if (typeof price !== "number") return "Rate to confirm";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function bookingStatusIsActive(status: CrewBooking["status"]) {
  return status === "pending" || status === "confirmed" || status === "blocked";
}

export function additionalItemLabel(value: CrewBooking["additionalItems"][number]) {
  return additionalItemOptions.find((item) => item.value === value)?.label ?? value;
}
