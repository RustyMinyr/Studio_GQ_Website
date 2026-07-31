const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_TIMEOUT_MS = 8_000;

export type StudioEmailConfig = {
  apiKey: string;
  from: string;
  to: string;
};

export type StudioEmailResult =
  | { sent: true; reason: "sent" }
  | { sent: false; reason: "not_configured" | "missing_recipient" | "failed" };

export type StudioEmailAttachment = {
  filename: string;
  content: string;
};

function configuredValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && !/^(?:your-|re_your|replace-|example)/i.test(trimmed)
    ? trimmed
    : null;
}

export function getStudioEmailConfig(): StudioEmailConfig | null {
  const apiKey = configuredValue(process.env.RESEND_API_KEY);
  const from = configuredValue(process.env.BOOKING_FROM_EMAIL);
  const to =
    configuredValue(process.env.BOOKING_NOTIFICATION_EMAIL) ??
    "bookings@studiogq.co.za";

  return apiKey && from ? { apiKey, from, to } : null;
}

export async function sendStudioEmail(
  config: StudioEmailConfig,
  input: {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
    idempotencyKey: string;
    replyTo?: string;
    bcc?: string[];
    attachments?: StudioEmailAttachment[];
  },
): Promise<StudioEmailResult> {
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
