import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let workerPromise;

async function getWorker() {
  workerPromise ??= import(
    new URL(`../dist/server/index.js?test=${process.pid}-${Date.now()}`, import.meta.url).href
  ).then(({ default: worker }) => worker);

  return workerPromise;
}

async function fetchSite(pathname, init) {
  const worker = await getWorker();
  return worker.fetch(
    new Request(`http://localhost${pathname}`, init),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function withTursoEnvironment(values, callback) {
  const previousUrl = process.env.TURSO_DATABASE_URL;
  const previousToken = process.env.TURSO_AUTH_TOKEN;
  const previousCrewEmail = process.env.CREW_PORTAL_EMAIL;
  const previousCrewPassword = process.env.CREW_PORTAL_PASSWORD;
  const previousSessionSecret = process.env.CREW_SESSION_SECRET;

  if (values) {
    process.env.TURSO_DATABASE_URL = values.url;
    process.env.TURSO_AUTH_TOKEN = values.token;
    process.env.CREW_PORTAL_EMAIL = values.crewEmail;
    process.env.CREW_PORTAL_PASSWORD = values.crewPassword;
    process.env.CREW_SESSION_SECRET = values.sessionSecret;
  } else {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    delete process.env.CREW_PORTAL_EMAIL;
    delete process.env.CREW_PORTAL_PASSWORD;
    delete process.env.CREW_SESSION_SECRET;
  }

  try {
    return await callback();
  } finally {
    if (previousUrl === undefined) delete process.env.TURSO_DATABASE_URL;
    else process.env.TURSO_DATABASE_URL = previousUrl;
    if (previousToken === undefined) delete process.env.TURSO_AUTH_TOKEN;
    else process.env.TURSO_AUTH_TOKEN = previousToken;
    if (previousCrewEmail === undefined) delete process.env.CREW_PORTAL_EMAIL;
    else process.env.CREW_PORTAL_EMAIL = previousCrewEmail;
    if (previousCrewPassword === undefined) delete process.env.CREW_PORTAL_PASSWORD;
    else process.env.CREW_PORTAL_PASSWORD = previousCrewPassword;
    if (previousSessionSecret === undefined) delete process.env.CREW_SESSION_SECRET;
    else process.env.CREW_SESSION_SECRET = previousSessionSecret;
  }
}

const validBooking = {
  requestId: "9a5364fd-2a92-4ee5-b7c3-275f0129ba47",
  dates: ["2099-02-20"],
  session: "morning",
  name: "Amina Jacobs",
  company: "North Star Films",
  email: "amina@example.com",
  phone: "+27 82 555 0199",
  additionalItems: ["studio_flashes", "audio_recording"],
  message: "An interview production requiring studio lighting and sound support.",
  website: "",
};

function bookingRequest(body, ip) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  };
}

test("renders the compact homepage enquiry form and booking link", async () => {
  const response = await fetchSite("/", {
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Studio GQ \| Film, Photography &amp; Podcast Studio in Gqeberha<\/title>/i);
  assert.match(html, /<main[\s>]/i);
  assert.match(html, /<h1[\s>]/i);
  assert.match(html, /<form[\s>]/i);
  assert.match(html, /<label[^>]*for="quick-name"/i);
  assert.match(html, /<label[^>]*for="quick-email"/i);
  assert.match(html, /online booking/i);
  assert.match(html, /everything is ready to help your shoot run smoothly/i);
  assert.doesNotMatch(html, /studio-production-wide\.webp/i);
  assert.doesNotMatch(html, /behind-the-scenes\.webp/i);
  assert.doesNotMatch(html, /hair-makeup-detail\.webp/i);
  assert.doesNotMatch(html, /hair-makeup\.webp/i);
  assert.match(html, /studio-content-hair-styling\.webp/i);
  assert.match(html, /studio-portrait-pair\.webp/i);
  assert.doesNotMatch(html, /studio-cyclorama-portrait\.jpg/i);
  assert.match(html, /studio-gq-overview\.mp4/i);
  assert.match(html, /studio-gq-video-poster\.jpg/i);
  assert.match(html, /<video/i);
  assert.match(html, /Watch tour video/i);
  assert.match(html, /<dialog[^>]*aria-labelledby="studio-tour-dialog-title"/i);
  assert.match(html, /aria-label="Close tour video"/i);
  assert.match(html, /studio-gq-tour\.mp4/i);
  assert.match(html, /studio-gq-tour-poster\.jpg/i);
  assert.match(html, /id="studio-tour"/i);
  assert.match(html, /href="\/privacy"/i);
  assert.match(html, /href="\/booking"/i);
  assert.match(html, />Booking<\/a>/i);
  assert.match(html, /bookings@studiogq\.co\.za/i);
  assert.match(html, /\+27 84 515 0956/i);
});

test("renders the complete accessible booking portal", async () => {
  const response = await fetchSite("/booking", {
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<h1[\s>]/i);
  assert.match(html, /page-hero page-hero--dark/i);
  assert.match(html, /<form[\s>]/i);
  assert.match(html, /<label[^>]*for="name"/i);
  assert.match(html, /<label[^>]*for="email"/i);
  assert.match(html, /additional items/i);
  assert.match(html, /studio flashes/i);
  assert.match(html, /constant lighting/i);
  assert.match(html, /green screen/i);
  assert.match(html, /catering/i);
  assert.match(html, /audio recording/i);
  assert.match(html, /live streaming/i);
  assert.match(html, /videographer/i);
  assert.match(html, /photographer/i);
  assert.match(html, /quoted separately/i);
  assert.doesNotMatch(html, /facilities needed/i);
  assert.doesNotMatch(html, /crew size/i);
  assert.match(html, /half day/i);
  assert.match(html, /full day/i);
  assert.match(html, /R2,500/i);
  assert.match(html, /R4,500/i);
  assert.match(html, /Gqeberha \/ Eastern Cape/i);
  assert.match(html, /Production, under one roof/i);
  assert.match(html, /Production support/i);
  assert.match(html, /name="website"/i);
  assert.match(html, /SUBMIT BOOKING/i);
  assert.doesNotMatch(html, /CONTINUE BOOKING ENQUIRY/i);
});

test("rejects invalid booking fields and past dates", async () => {
  const invalidResponse = await fetchSite(
    "/api/bookings",
    bookingRequest({ email: "not-an-email" }, "192.0.2.10"),
  );
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidResponse.headers.get("cache-control"), "no-store");
  assert.equal(invalidResponse.headers.get("ratelimit-limit"), "5");
  const invalid = await invalidResponse.json();
  assert.ok(invalid.errors.dates);
  assert.ok(invalid.errors.session);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);

  const pastResponse = await fetchSite(
    "/api/bookings",
    bookingRequest({ ...validBooking, dates: ["2000-01-01"] }, "192.0.2.11"),
  );
  assert.equal(pastResponse.status, 400);
  const past = await pastResponse.json();
  assert.match(past.errors.dates[0], /today or a future date/i);
});

test("returns graceful responses while Turso is unconfigured", async () => {
  await withTursoEnvironment(null, async () => {
    const availabilityResponse = await fetchSite("/api/availability?month=2099-02");
    assert.equal(availabilityResponse.status, 200);
    assert.deepEqual(await availabilityResponse.json(), {
      configured: false,
      month: "2099-02",
      occupied: [],
    });

    const bookingResponse = await fetchSite(
      "/api/bookings",
      bookingRequest(validBooking, "192.0.2.12"),
    );
    assert.equal(bookingResponse.status, 503);
    const booking = await bookingResponse.json();
    assert.equal(booking.configured, false);
    assert.match(booking.message, /not configured/i);
  });
});

test("keeps the crew portal private and shows a safe setup state until configured", async () => {
  await withTursoEnvironment(null, async () => {
    const response = await fetchSite("/crew", { headers: { accept: "text/html" } });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Booking management is almost ready/i);
    assert.match(html, /Add Studio GQ/i);
    assert.doesNotMatch(html, /TURSO_AUTH_TOKEN/i);
  });
});

test("rejects a malformed booking request identifier", async () => {
  const response = await fetchSite(
    "/api/bookings",
    bookingRequest({ ...validBooking, requestId: "not-a-uuid" }, "192.0.2.141"),
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.errors.requestId[0], /could not be identified/i);
});

test("ships atomic Turso booking groups and slot protection", async () => {
  const [migration, bookings] = await Promise.all([
    readFile(new URL("../turso/migrations/202607200001_create_studio_booking_system.sql", import.meta.url), "utf8"),
    readFile(new URL("../lib/turso-bookings.ts", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /studio_booking_groups/i);
  assert.match(migration, /unique \(booking_date, slot\)/i);
  assert.match(migration, /studio_calendar_blocks/i);
  assert.match(bookings, /transaction\("write"\)/i);
  assert.match(bookings, /payloadHash/i);
  assert.match(bookings, /That session has just been booked/i);
});

test("ships safe crew calendar holds, blocks and booking controls", async () => {
  const [migration, auth, bookingActions, footer] = await Promise.all([
    readFile(new URL("../turso/migrations/202607200001_create_studio_booking_system.sql", import.meta.url), "utf8"),
    readFile(new URL("../lib/crew-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/crew/CrewBookingActions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/shell/Footer.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(migration, /hold_expires_at/i);
  assert.match(migration, /studio_calendar_blocks/i);
  assert.match(migration, /booking_id is not null and block_id is null/i);
  assert.match(auth, /httpOnly: true/i);
  assert.match(auth, /sameSite: "strict"/i);
  assert.match(auth, /CREW_PORTAL_EMAIL/i);
  assert.match(auth, /CREW_SESSION_SECRET/i);
  assert.match(bookingActions, /Confirm booking/i);
  assert.match(bookingActions, /Cancel booking/i);
  assert.match(bookingActions, /Email client/i);
  assert.match(footer, /href="\/crew"/i);
});

test("ships a secure UUID fallback and freezes the booking form in flight", async () => {
  const form = await readFile(
    new URL("../components/contact/BookingEnquiryForm.tsx", import.meta.url),
    "utf8",
  );

  assert.match(form, /crypto\?\.randomUUID/);
  assert.match(form, /crypto\?\.getRandomValues/);
  assert.match(form, /disabled=\{isSubmitting\}/);
  assert.match(form, /submission\.kind === "submitting"/);
});

test("blocks cross-origin booking submissions", async () => {
  const response = await fetchSite("/api/bookings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      "sec-fetch-site": "cross-site",
      "x-forwarded-for": "192.0.2.15",
    },
    body: "{}",
  });

  assert.equal(response.status, 403);
});

test("blocks booking submissions without a browser origin", async () => {
  const response = await fetchSite("/api/bookings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.0.2.151",
    },
    body: JSON.stringify(validBooking),
  });

  assert.equal(response.status, 403);
});

test("silently accepts booking honeypot submissions", async () => {
  const response = await fetchSite(
    "/api/bookings",
    bookingRequest({ website: "https://spam.example" }, "192.0.2.16"),
  );

  assert.equal(response.status, 202);
  const payload = await response.json();
  assert.match(payload.message, /booking request has been received/i);
});

test("publishes canonical sitemap and robots directives", async () => {
  const [sitemapResponse, robotsResponse] = await Promise.all([
    fetchSite("/sitemap.xml"),
    fetchSite("/robots.txt"),
  ]);
  assert.equal(sitemapResponse.status, 200);
  assert.equal(robotsResponse.status, 200);

  const [sitemap, robots] = await Promise.all([
    sitemapResponse.text(),
    robotsResponse.text(),
  ]);
  assert.doesNotMatch(sitemap, /https:\/\/www\.studiogq\.co\.za\/contact/);
  assert.doesNotMatch(sitemap, /https:\/\/www\.studiogq\.co\.za\/gallery/);
  assert.match(sitemap, /https:\/\/www\.studiogq\.co\.za\/privacy/);
  assert.match(sitemap, /https:\/\/www\.studiogq\.co\.za\/terms/);
  assert.match(sitemap, /https:\/\/www\.studiogq\.co\.za\/booking/);
  assert.match(robots, /Disallow: \/api\//i);
  assert.match(robots, /Disallow: \/crew\//i);
  assert.match(robots, /Sitemap: https:\/\/www\.studiogq\.co\.za\/sitemap\.xml/i);
});

test("renders every public route with one main landmark and live assets", async () => {
  const routes = ["/", "/booking", "/privacy", "/terms"];

  for (const route of routes) {
    const response = await fetchSite(route, { headers: { accept: "text/html" } });
    assert.equal(response.status, 200, `${route} should render`);
    assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/i);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    const html = await response.text();
    assert.equal((html.match(/<main[\s>]/gi) ?? []).length, 1, `${route} should have one main landmark`);
    assert.equal((html.match(/<h1[\s>]/gi) ?? []).length, 1, `${route} should have one h1`);
    assert.doesNotMatch(html, /Studio GQ \| Studio GQ/i);
    assert.match(html, /studio-gq-white\.png/i);
  }
});

test("permanently redirects legacy pages into the one-page experience", async () => {
  const redirects = new Map([
    ["/about", "/#about"],
    ["/spaces", "/#about"],
    ["/equipment", "/#equipment"],
    ["/faq", "/#faq"],
    ["/contact", "/#contact"],
    ["/gallery", "/"],
  ]);

  for (const [route, destination] of redirects) {
    const response = await fetchSite(route, { redirect: "manual" });
    assert.equal(response.status, 308, `${route} should be permanent`);
    assert.equal(new URL(response.headers.get("location")).pathname + new URL(response.headers.get("location")).hash, destination);
  }
});

test("uses canonical social metadata and optimized image assets", async () => {
  const homepage = await (await fetchSite("/", { headers: { accept: "text/html" } })).text();
  assert.match(homepage, /<meta property="og:url" content="https:\/\/www\.studiogq\.co\.za\/?"/i);
  assert.match(homepage, /hero-studio-gq\.webp/i);
  assert.doesNotMatch(homepage, /studio-gq-white-transparent\.svg/i);

  const booking = await (await fetchSite("/booking", { headers: { accept: "text/html" } })).text();
  assert.match(booking, /<meta property="og:url" content="https:\/\/www\.studiogq\.co\.za\/booking"/i);
});
