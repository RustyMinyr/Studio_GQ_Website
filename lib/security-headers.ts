function contentSecurityPolicy(allowDevelopmentEval = false) {
  return [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' mailto:",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${allowDevelopmentEval ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self'",
  "upgrade-insecure-requests",
  ].join("; ");
}

export function createSecurityHeaders(allowDevelopmentEval = false) {
  return [
  { key: "Content-Security-Policy", value: contentSecurityPolicy(allowDevelopmentEval) },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  ] as const;
}

/** Production and worker headers. Development uses an explicitly looser variant. */
export const securityHeaders = createSecurityHeaders();
