import type { BookingFormData } from "@/lib/booking-schema";

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_TIMEOUT_MS = 8_000;

type EmailConfig = {
  apiKey: string;
  from: string;
  to: string;
};

function configuredValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && !trimmed.startsWith("your-") ? trimmed : null;
}

function getEmailConfig(): EmailConfig | null {
  const apiKey = configuredValue(process.env.RESEND_API_KEY);
  const from = configuredValue(process.env.BOOKING_FROM_EMAIL);
  const to = configuredValue(process.env.BOOKING_NOTIFICATION_EMAIL) ?? "booking@studiogq.co.za";

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

/**
 * Sends the internal notification only after the booking transaction succeeds.
 * A missing or unavailable email provider must never discard a valid booking.
 */
export async function notifyStudioOfBooking(booking: BookingFormData, bookingGroupId: string) {
  const config = getEmailConfig();
  if (!config) return { sent: false, reason: "not_configured" as const };

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

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `studio-gq-booking-${booking.requestId}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        subject,
        text,
        html: `<main style="font-family:Arial,sans-serif;color:#111;line-height:1.5"><h1 style="font-size:24px">New Studio GQ booking enquiry</h1><h2 style="font-size:14px">Requested dates</h2><ul>${htmlDates}</ul><p><strong>Session:</strong> ${escapeHtml(sessionLabel(booking.session))}</p><p><strong>Additional items:</strong> ${escapeHtml(extras)}</p><hr><p><strong>Name:</strong> ${escapeHtml(booking.name)}<br><strong>Company:</strong> ${escapeHtml(booking.company || "Not specified")}<br><strong>Email:</strong> ${escapeHtml(booking.email)}<br><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p><h2 style="font-size:14px">Production details</h2><p style="white-space:pre-wrap">${escapeHtml(booking.message)}</p><p style="color:#666;font-size:12px">Booking reference: ${escapeHtml(bookingGroupId)}</p></main>`,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
    });

    return { sent: response.ok, reason: response.ok ? "sent" as const : "failed" as const };
  } catch {
    return { sent: false, reason: "failed" as const };
  }
}
