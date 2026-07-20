import { z } from "zod";

export const additionalItemOptions = [
  { value: "studio_flashes", label: "Studio flashes" },
  { value: "constant_lighting", label: "Constant lighting" },
  { value: "green_screen", label: "Green screen" },
  { value: "catering", label: "Catering" },
  { value: "audio_recording", label: "Audio recording" },
  { value: "live_streaming", label: "Live streaming" },
  { value: "videographer", label: "Videographer" },
  { value: "photographer", label: "Photographer" },
] as const;

export const bookingSessions = [
  {
    value: "morning",
    label: "Half day · Morning",
    time: "08:00–12:00",
    price: 2500,
    priceLabel: "R2,500",
  },
  {
    value: "afternoon",
    label: "Half day · Afternoon",
    time: "13:00–17:00",
    price: 2500,
    priceLabel: "R2,500",
  },
  {
    value: "full_day",
    label: "Full day",
    time: "10 hours",
    price: 4500,
    priceLabel: "R4,500",
  },
] as const;

const additionalItemValues = additionalItemOptions.map((option) => option.value) as [
  (typeof additionalItemOptions)[number]["value"],
  ...(typeof additionalItemOptions)[number]["value"][],
];
const bookingSessionValues = bookingSessions.map((session) => session.value) as [
  (typeof bookingSessions)[number]["value"],
  ...(typeof bookingSessions)[number]["value"][],
];
export const reservableSlots = ["morning", "afternoon"] as const;

export const sessionDetails = {
  morning: {
    label: "Half day · 08:00–12:00",
    priceZar: 2500,
    slots: ["morning"],
  },
  afternoon: {
    label: "Half day · 13:00–17:00",
    priceZar: 2500,
    slots: ["afternoon"],
  },
  full_day: {
    label: "Full day · 10 hours",
    priceZar: 4500,
    slots: ["morning", "afternoon"],
  },
} as const satisfies Record<
  (typeof bookingSessions)[number]["value"],
  {
    label: string;
    priceZar: number;
    slots: readonly (typeof reservableSlots)[number][];
  }
>;

const phoneNumber = z
  .string()
  .trim()
  .min(7, "Enter a phone number.")
  .max(30, "Phone number is too long.")
  .refine(
    (value) => /^[+()\-\s\d]+$/.test(value) && value.replace(/\D/g, "").length >= 7,
    "Enter a valid phone number.",
  );

function isCalendarDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function currentJohannesburgDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${value.year}-${value.month}-${value.day}`;
}

export const bookingSchema = z
  .object({
    requestId: z.string().uuid("The booking request could not be identified."),
    dates: z
      .array(
        z
          .string()
          .trim()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a booking date.")
          .refine(isCalendarDate, "Choose a valid booking date.")
          .refine(
            (value) => value >= currentJohannesburgDate(),
            "Choose today or a future date.",
          ),
      )
      .min(1, "Choose at least one booking date.")
      .max(14, "Choose up to 14 booking dates per enquiry.")
      .refine((dates) => new Set(dates).size === dates.length, "Choose each date once."),
    session: z.enum(bookingSessionValues, {
      errorMap: () => ({ message: "Choose a booking session." }),
    }),
    name: z.string().trim().min(2, "Enter your name.").max(100),
    company: z.string().trim().max(120).optional(),
    email: z.string().trim().email("Enter a valid email address.").max(254),
    phone: phoneNumber,
    additionalItems: z.array(z.enum(additionalItemValues)).max(8).default([]),
    message: z
      .string()
      .trim()
      .min(20, "Tell us a little more about your production.")
      .max(2000, "Keep your message under 2,000 characters."),
    website: z.string().trim().max(160).optional(),
  })
  .strict();

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use a month in YYYY-MM format.");

export type BookingFormData = z.infer<typeof bookingSchema>;
export type BookingSession = (typeof bookingSessions)[number]["value"];
export type ReservableSlot = (typeof reservableSlots)[number];
export type AdditionalItem = (typeof additionalItemOptions)[number]["value"];
