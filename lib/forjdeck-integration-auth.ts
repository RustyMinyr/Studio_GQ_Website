import "server-only";

import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const PROTOCOL_VERSION = "1";
const MAX_CLOCK_SKEW_SECONDS = 5 * 60;
const MAX_TRACKED_NONCES = 10_000;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const usedNonces = new Map<string, number>();

type IntegrationConfig = {
  secret: string;
  allowedOrganizationId: string;
};

export type ForjdeckAuthenticationResult =
  | { ok: true; organizationId: string }
  | {
      ok: false;
      status: 401 | 409 | 503;
      message: string;
    };

function configuredValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed &&
    !trimmed.startsWith("your-") &&
    !trimmed.startsWith("generate-")
    ? trimmed
    : null;
}

function getIntegrationConfig(): IntegrationConfig | null {
  const secret = configuredValue(process.env.FORJDECK_INTEGRATION_SECRET);
  const allowedOrganizationId = configuredValue(
    process.env.FORJDECK_ALLOWED_ORGANIZATION_ID,
  );

  if (
    !secret ||
    secret.length < 32 ||
    !allowedOrganizationId ||
    allowedOrganizationId.length > 200
  ) {
    return null;
  }

  return { secret, allowedOrganizationId };
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function equalHex(left: string, right: string) {
  if (!SHA256_HEX_PATTERN.test(left) || !SHA256_HEX_PATTERN.test(right)) {
    return false;
  }

  const bytes = (value: string) =>
    Uint8Array.from(
      value.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? [],
    );
  return timingSafeEqual(bytes(left), bytes(right));
}

/**
 * Both applications sort query keys, then values, and serialize them with
 * URLSearchParams before signing. The URL fragment is never part of a request.
 */
export function canonicalRequestTarget(requestUrl: string) {
  const url = new URL(requestUrl);
  const entries = [...url.searchParams.entries()].sort(
    ([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
      }
      return leftKey < rightKey ? -1 : 1;
    },
  );
  const query = new URLSearchParams(entries).toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

export function canonicalForjdeckRequest(input: {
  method: string;
  requestUrl: string;
  organizationId: string;
  timestamp: string;
  nonce: string;
  contentSha256: string;
}) {
  return [
    PROTOCOL_VERSION,
    input.method.toUpperCase(),
    canonicalRequestTarget(input.requestUrl),
    input.organizationId,
    input.timestamp,
    input.nonce,
    input.contentSha256,
  ].join("\n");
}

function pruneUsedNonces(nowSeconds: number) {
  const oldestAllowed = nowSeconds - MAX_CLOCK_SKEW_SECONDS;
  for (const [key, seenAt] of usedNonces) {
    if (seenAt >= oldestAllowed) continue;
    usedNonces.delete(key);
  }

  while (usedNonces.size >= MAX_TRACKED_NONCES) {
    const oldest = usedNonces.keys().next().value;
    if (typeof oldest !== "string") break;
    usedNonces.delete(oldest);
  }
}

/**
 * Authenticates a Forjdeck server request. The raw request body must be supplied
 * byte-for-byte as received so its SHA-256 digest matches the signed digest.
 */
export function authenticateForjdeckRequest(
  request: Request,
  rawBody: string,
): ForjdeckAuthenticationResult {
  const config = getIntegrationConfig();
  if (!config) {
    return {
      ok: false,
      status: 503,
      message: "The Forjdeck integration is not configured.",
    };
  }

  const version = request.headers.get("x-forjdeck-version");
  const organizationId = request.headers.get("x-forjdeck-organization-id");
  const timestamp = request.headers.get("x-forjdeck-timestamp");
  const nonce = request.headers.get("x-forjdeck-nonce");
  const contentSha256 = request.headers.get("x-forjdeck-content-sha256");
  const signature = request.headers.get("x-forjdeck-signature");

  if (
    version !== PROTOCOL_VERSION ||
    !organizationId ||
    !timestamp ||
    !nonce ||
    !contentSha256 ||
    !signature ||
    !/^\d{1,12}$/.test(timestamp) ||
    !UUID_PATTERN.test(nonce) ||
    !SHA256_HEX_PATTERN.test(contentSha256) ||
    !SHA256_HEX_PATTERN.test(signature)
  ) {
    return {
      ok: false,
      status: 401,
      message: "The integration signature could not be verified.",
    };
  }

  const timestampSeconds = Number(timestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (
    !Number.isSafeInteger(timestampSeconds) ||
    Math.abs(nowSeconds - timestampSeconds) > MAX_CLOCK_SKEW_SECONDS
  ) {
    return {
      ok: false,
      status: 401,
      message: "The integration signature could not be verified.",
    };
  }

  const actualContentSha256 = sha256(rawBody);
  const canonical = canonicalForjdeckRequest({
    method: request.method,
    requestUrl: request.url,
    organizationId,
    timestamp,
    nonce,
    contentSha256,
  });
  const expectedSignature = createHmac("sha256", config.secret)
    .update(canonical, "utf8")
    .digest("hex");

  if (
    organizationId !== config.allowedOrganizationId ||
    !equalHex(contentSha256, actualContentSha256) ||
    !equalHex(signature, expectedSignature)
  ) {
    return {
      ok: false,
      status: 401,
      message: "The integration signature could not be verified.",
    };
  }

  pruneUsedNonces(nowSeconds);
  const nonceKey = `${organizationId}:${nonce.toLowerCase()}`;
  if (usedNonces.has(nonceKey)) {
    return {
      ok: false,
      status: 409,
      message: "This integration request has already been used.",
    };
  }
  usedNonces.set(nonceKey, nowSeconds);

  return { ok: true, organizationId };
}

export function forjdeckResponseHeaders() {
  return {
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  };
}
