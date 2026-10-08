import type { NextRequest } from 'next/server';

/** Use the configured public origin behind a proxy, never an untrusted Host header. */
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const expected = process.env.APP_ORIGIN || (process.env.NODE_ENV === 'production'
    ? 'https://www.studiogq.co.za' : new URL(request.url).origin);
  return origin === expected;
}
