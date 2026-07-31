import type { EnquiryData } from "@/lib/enquiry-schema";
import {
  getStudioEmailConfig,
  sendStudioEmail,
  type StudioEmailResult,
} from "@/lib/resend-email";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function enquiryTitle(kind: EnquiryData["kind"]) {
  if (kind === "workshop_interest") return "Workshop interest";
  if (kind === "newsletter") return "Newsletter request";
  return "Quick enquiry";
}

export async function notifyStudioOfEnquiry(
  enquiry: EnquiryData,
): Promise<StudioEmailResult> {
  const config = getStudioEmailConfig();
  if (!config) return { sent: false, reason: "not_configured" };

  const title = enquiryTitle(enquiry.kind);
  const name = "name" in enquiry ? enquiry.name : "Newsletter subscriber";
  const phone = "phone" in enquiry && enquiry.phone ? enquiry.phone : "Not provided";
  const message = "message" in enquiry && enquiry.message ? enquiry.message : "Not provided";
  const subject = `${title} — ${"name" in enquiry ? enquiry.name : enquiry.email}`;
  const text = [
    title,
    "",
    `Name: ${name}`,
    `Email: ${enquiry.email}`,
    ...(enquiry.kind === "newsletter"
      ? []
      : [`Phone: ${phone}`, "", "Message:", message]),
  ].join("\n");

  return sendStudioEmail(config, {
    to: config.to,
    replyTo: enquiry.email,
    subject,
    text,
    idempotencyKey: `studio-gq-enquiry-${enquiry.requestId}`,
    html: `<main style="font-family:Arial,sans-serif;color:#111;line-height:1.5"><h1 style="font-size:24px">${escapeHtml(title)}</h1><p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(enquiry.email)}${enquiry.kind === "newsletter" ? "" : `<br><strong>Phone:</strong> ${escapeHtml(phone)}`}</p>${enquiry.kind === "newsletter" ? "" : `<h2 style="font-size:14px">Message</h2><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`}</main>`,
  });
}
