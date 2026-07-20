import type { BookingFormData } from "@/lib/booking-schema";
import type { CrewBooking } from "@/lib/crew-types";

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_TIMEOUT_MS = 8_000;

type EmailConfig = {
  apiKey: string;
  from: string;
  to: string;
};

export type BookingEmailResult =
  | { sent: true; reason: "sent" }
  | { sent: false; reason: "not_configured" | "missing_recipient" | "failed" };

export type BookingQuoteAttachment = {
  filename: string;
  content: string;
};

function configuredValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && !trimmed.startsWith("your-") ? trimmed : null;
}

function getEmailConfig(): EmailConfig | null {
  const apiKey = configuredValue(process.env.RESEND_API_KEY);
  const from = configuredValue(process.env.BOOKING_FROM_EMAIL);
  const to = configuredValue(process.env.BOOKING_NOTIFICATION_EMAIL) ?? "bookings@studiogq.co.za";

  return apiKey && from ? { apiKey, from, to } : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function sessionLabel(session: BookingFormData["session"]) {
  if (session === "morning") return "Half day · Morning (08:00–12:00)";
  if (session === "afternoon") return "Half day · Afternoon (13:00–17:00)";
  return "Full day · 10 hours";
}

async function sendEmail(
  config: EmailConfig,
  input: {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
    idempotencyKey: string;
    replyTo?: string;
    bcc?: string[];
    attachments?: BookingQuoteAttachment[];
  },
): Promise<BookingEmailResult> {
  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        ...(input.bcc?.length ? { bcc: input.bcc } : {}),
        ...(input.attachments?.length ? { attachments: input.attachments } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    });

    if (response.ok) return { sent: true, reason: "sent" };
    return { sent: false, reason: "failed" };
  } catch {
    return { sent: false, reason: "failed" };
  }
}

export async function notifyClientOfPendingBooking(
  booking: BookingFormData,
  bookingGroupId: string,
): Promise<BookingEmailResult> {
  const config = getEmailConfig();
  if (!config) return { sent: false, reason: "not_configured" };

  const dates = booking.dates.map(formatDate);
  const dateList = dates.map((date) => `- ${date}`).join("\n");
  const htmlDates = dates.map((date) => `<li>${escapeHtml(date)}</li>`).join("");
  const subject = "Studio GQ booking enquiry received";
  const text = [
    `Hi ${booking.name},`,
    "",
    "Thank you for your Studio GQ booking enquiry. Your request is pending review while our team confirms availability.",
    "",
    "Requested dates:",
    dateList,
    `Session: ${sessionLabel(booking.session)}`,
    "",
    "We will be in touch shortly.",
    "",
    "Studio GQ",
    `Booking reference: ${bookingGroupId}`,
  ].join("\n");

  return sendEmail(config, {
    to: booking.email,
    replyTo: config.to,
    subject,
    text,
    idempotencyKey: `studio-gq-pending-${booking.requestId}`,
    html: `<main style="font-family:Arial,sans-serif;color:#111;line-height:1.5"><p>Hi ${escapeHtml(booking.name)},</p><p>Thank you for your Studio GQ booking enquiry. Your request is <strong>pending review</strong> while our team confirms availability.</p><h2 style="font-size:14px">Requested dates</h2><ul>${htmlDates}</ul><p><strong>Session:</strong> ${escapeHtml(sessionLabel(booking.session))}</p><p>We will be in touch shortly.</p><p>Studio GQ</p><p style="color:#666;font-size:12px">Booking reference: ${escapeHtml(bookingGroupId)}</p></main>`,
  });
}

/**
 * Sends the internal notification only after the booking transaction succeeds.
 * A missing or unavailable email provider must never discard a valid booking.
 */
export async function notifyStudioOfBooking(booking: BookingFormData, bookingGroupId: string) {
  const config = getEmailConfig();
  if (!config) return { sent: false, reason: "not_configured" } satisfies BookingEmailResult;

  const dates = booking.dates.map(formatDate);
  const dateList = dates.map((date) => `• ${date}`).join("\n");
  const htmlDates = dates.map((date) => `<li>${escapeHtml(date)}</li>`).join("");
  const extras = booking.additionalItems.length ? booking.additionalItems.join(", ") : "None";
  const subject = `New Studio GQ booking enquiry — ${dates.length} day${dates.length === 1 ? "" : "s"}`;
  const text = [
    "New Studio GQ booking enquiry",
    "",
    "Requested dates:",
    dateList,
    `Session: ${sessionLabel(booking.session)}`,
    `Additional items: ${extras}`,
    "",
    `Name: ${booking.name}`,
    `Company: ${booking.company || "Not specified"}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    "",
    "Production details:",
    booking.message,
    "",
    `Booking reference: ${bookingGroupId}`,
  ].join("\n");

  return sendEmail(config, {
    to: config.to,
    subject,
    text,
    replyTo: booking.email,
    idempotencyKey: `studio-gq-booking-${booking.requestId}`,
    html: `<main style="font-family:Arial,sans-serif;color:#111;line-height:1.5"><h1 style="font-size:24px">New Studio GQ booking enquiry</h1><h2 style="font-size:14px">Requested dates</h2><ul>${htmlDates}</ul><p><strong>Session:</strong> ${escapeHtml(sessionLabel(booking.session))}</p><p><strong>Additional items:</strong> ${escapeHtml(extras)}</p><hr><p><strong>Name:</strong> ${escapeHtml(booking.name)}<br><strong>Company:</strong> ${escapeHtml(booking.company || "Not specified")}<br><strong>Email:</strong> ${escapeHtml(booking.email)}<br><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p><h2 style="font-size:14px">Production details</h2><p style="white-space:pre-wrap">${escapeHtml(booking.message)}</p><p style="color:#666;font-size:12px">Booking reference: ${escapeHtml(bookingGroupId)}</p></main>`,
  });
}

/** Sends the approved booking and optional crew note to the client. */
export async function notifyClientOfBookingConfirmation(
  booking: CrewBooking,
  note?: string,
  quote?: BookingQuoteAttachment,
): Promise<BookingEmailResult> {
  const config = getEmailConfig();
  if (!config) return { sent: false, reason: "not_configured" };
  if (!booking.email) return { sent: false, reason: "missing_recipient" };

  const date = formatDate(booking.bookingDate);
  const title = booking.name?.trim() || "there";
  const session = sessionLabel(booking.session);
  const subject = `Studio GQ booking confirmed - ${date}`;
  const message = note?.trim() || "Your Studio GQ booking has been confirmed. We look forward to welcoming you to the studio.";
  const text = [
    `Hi ${title},`,
    "",
    "Your Studio GQ booking has been confirmed.",
    "",
    `Date: ${date}`,
    `Session: ${session}`,
    "",
    message,
    quote ? "" : undefined,
    quote ? `Your quote is attached: ${quote.filename}` : undefined,
    "",
    "Studio GQ",
  ].filter((line): line is string => typeof line === "string").join("\n");

  return sendEmail(config, {
    to: booking.email,
    bcc: [config.to],
    replyTo: config.to,
    subject,
    text,
    idempotencyKey: `studio-gq-confirmation-${booking.id}`,
    attachments: quote ? [quote] : undefined,
    html: `<main style="font-family:Arial,sans-serif;color:#111;line-height:1.5"><p>Hi ${escapeHtml(title)},</p><p>Your Studio GQ booking has been <strong>confirmed</strong>.</p><p><strong>Date:</strong> ${escapeHtml(date)}<br><strong>Session:</strong> ${escapeHtml(session)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>${quote ? `<p>Your quote is attached: <strong>${escapeHtml(quote.filename)}</strong></p>` : ""}<p>Studio GQ</p></main>`,
  });
}
