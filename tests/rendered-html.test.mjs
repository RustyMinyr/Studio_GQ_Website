import assert from "node:assert/strict";
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

async function withSupabaseEnvironment(values, callback) {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (values) {
    process.env.SUPABASE_URL = values.url;
    process.env.SUPABASE_SERVICE_ROLE_KEY = values.key;
  } else {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  try {
    return await callback();
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
}

const validBooking = {
  date: "2099-02-20",
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
  assert.match(html, /href="[^"]*#studio-tour"/i);
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
  assert.ok(invalid.errors.date);
  assert.ok(invalid.errors.session);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);

  const pastResponse = await fetchSite(
    "/api/bookings",
    bookingRequest({ ...validBooking, date: "2000-01-01" }, "192.0.2.11"),
  );
  assert.equal(pastResponse.status, 400);
  const past = await pastResponse.json();
  assert.match(past.errors.date[0], /today or a future date/i);
});

test("returns graceful responses while Supabase is unconfigured", async () => {
  await withSupabaseEnvironment(null, async () => {
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

test("returns slot-only availability without exposing booking PII", async () => {
  const nativeFetch = globalThis.fetch;
  await withSupabaseEnvironment(
    { url: "https://project.supabase.co", key: "test-service-role-key" },
    async () => {
      globalThis.fetch = async (input, init) => {
        const url = String(input);
        assert.match(url, /studio_booking_slots/);
        assert.match(url, /select=booking_date%2Cslot/);
        assert.equal(init.headers.Authorization, "Bearer test-service-role-key");
        return Response.json([
          { booking_date: "2099-02-12", slot: "morning" },
          { booking_date: "2099-02-12", slot: "afternoon" },
          { booking_date: "2099-02-18", slot: "morning" },
        ]);
      };

      const response = await fetchSite("/api/availability?month=2099-02");
      assert.equal(response.status, 200);
      const raw = await response.text();
      assert.doesNotMatch(raw, /name|email|phone|company/i);
      assert.deepEqual(JSON.parse(raw), {
        configured: true,
        month: "2099-02",
        occupied: [
          { date: "2099-02-12", slots: ["morning", "afternoon"] },
          { date: "2099-02-18", slots: ["morning"] },
        ],
      });
    },
  );
  globalThis.fetch = nativeFetch;
});

test("creates a booking through the atomic Supabase RPC", async () => {
  const nativeFetch = globalThis.fetch;
  await withSupabaseEnvironment(
    { url: "https://project.supabase.co", key: "test-service-role-key" },
    async () => {
      globalThis.fetch = async (input, init) => {
        assert.equal(String(input), "https://project.supabase.co/rest/v1/rpc/create_studio_booking");
        assert.equal(init.method, "POST");
        const rpc = JSON.parse(init.body);
        assert.equal(rpc.p_booking_date, validBooking.date);
        assert.equal(rpc.p_session, "full_day");
        assert.equal(rpc.p_email, validBooking.email);
        assert.deepEqual(rpc.p_additional_items, validBooking.additionalItems);
        return Response.json("123e4567-e89b-42d3-a456-426614174000");
      };

      const response = await fetchSite(
        "/api/bookings",
        bookingRequest({ ...validBooking, session: "full_day" }, "192.0.2.13"),
      );
      assert.equal(response.status, 201);
      assert.deepEqual(await response.json(), {
        message: "Your studio booking has been received.",
        bookingId: "123e4567-e89b-42d3-a456-426614174000",
        configured: true,
      });
    },
  );
  globalThis.fetch = nativeFetch;
});

test("maps a Supabase slot collision to a booking conflict", async () => {
  const nativeFetch = globalThis.fetch;
  await withSupabaseEnvironment(
    { url: "https://project.supabase.co", key: "test-service-role-key" },
    async () => {
      globalThis.fetch = async () =>
        Response.json(
          { code: "23505", message: "duplicate key value violates unique constraint" },
          { status: 409 },
        );

      const response = await fetchSite(
        "/api/bookings",
        bookingRequest(validBooking, "192.0.2.14"),
      );
      assert.equal(response.status, 409);
      const payload = await response.json();
      assert.equal(payload.code, "slot_unavailable");
      assert.equal(payload.configured, true);
    },
  );
  globalThis.fetch = nativeFetch;
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
