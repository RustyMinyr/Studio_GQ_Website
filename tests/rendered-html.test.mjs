import assert from "node:assert/strict";
import test from "node:test";

let workerPromise;

async function fetchSite(pathname, init) {
  workerPromise ??= import(
    new URL(`../dist/server/index.js?test=${process.pid}-${Date.now()}`, import.meta.url).href
  ).then(({ default: worker }) => worker);

  const worker = await workerPromise;
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

test("renders the complete accessible booking form", async () => {
  const response = await fetchSite("/contact", {
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Contact &amp; Bookings \| Studio GQ<\/title>/i);
  assert.match(html, /<main[\s>]/i);
  assert.match(html, /<h1[\s>]/i);
  assert.match(html, /<form[\s>]/i);
  assert.match(html, /<label[^>]*for="name"/i);
  assert.match(html, /<label[^>]*for="email"/i);
  assert.match(html, /<label[^>]*for="projectType"/i);
  assert.match(html, /<label[^>]*for="preferredDate"/i);
  assert.match(html, /name="website"/i);
  assert.match(html, /bookings@studiogq\.co\.za/i);
  assert.match(html, /\+27 84 515 0956/i);
});

test("rejects invalid contact payloads with field errors", async () => {
  const response = await fetchSite("/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.0.2.10",
    },
    body: JSON.stringify({ email: "not-an-email" }),
  });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("ratelimit-limit"), "5");
  const payload = await response.json();
  assert.match(payload.message, /highlighted fields/i);
  assert.ok(payload.errors.name);
  assert.ok(payload.errors.email);
  assert.ok(payload.errors.projectType);
});

test("accepts a valid booking enquiry", async () => {
  const response = await fetchSite("/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-forwarded-for": "192.0.2.11",
    },
    body: JSON.stringify({
      name: "Amina Jacobs",
      company: "North Star Films",
      email: "amina@example.com",
      phone: "+27 82 555 0199",
      projectType: "Film production",
      preferredDate: "2027-02-20",
      shootDays: "2",
      crewSize: "12",
      message: "A two-day interview production requiring lighting and sound support.",
      website: "",
    }),
  });

  assert.equal(response.status, 202);
  assert.equal(response.headers.get("ratelimit-remaining"), "4");
  const payload = await response.json();
  assert.match(payload.message, /ready to send/i);
});

test("blocks cross-origin submissions", async () => {
  const response = await fetchSite("/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
      "sec-fetch-site": "cross-site",
      "x-forwarded-for": "192.0.2.12",
    },
    body: "{}",
  });

  assert.equal(response.status, 403);
});

test("silently accepts honeypot submissions without processing them", async () => {
  const response = await fetchSite("/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.0.2.13",
    },
    body: JSON.stringify({ website: "https://spam.example" }),
  });

  assert.equal(response.status, 202);
  const payload = await response.json();
  assert.match(payload.message, /enquiry has been received/i);
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
  assert.match(sitemap, /https:\/\/www\.studiogq\.co\.za\/contact/);
  assert.match(sitemap, /https:\/\/www\.studiogq\.co\.za\/gallery/);
  assert.match(sitemap, /https:\/\/www\.studiogq\.co\.za\/privacy/);
  assert.match(sitemap, /https:\/\/www\.studiogq\.co\.za\/terms/);
  assert.match(robots, /Disallow: \/api\//i);
  assert.match(robots, /Sitemap: https:\/\/www\.studiogq\.co\.za\/sitemap\.xml/i);
});

test("renders every public route with one main landmark and live assets", async () => {
  const routes = ["/", "/about", "/equipment", "/gallery", "/faq", "/contact", "/privacy", "/terms"];

  for (const route of routes) {
    const response = await fetchSite(route, { headers: { accept: "text/html" } });
    assert.equal(response.status, 200, `${route} should render`);
    const html = await response.text();
    assert.equal((html.match(/<main[\s>]/gi) ?? []).length, 1, `${route} should have one main landmark`);
    assert.equal((html.match(/<h1[\s>]/gi) ?? []).length, 1, `${route} should have one h1`);
    assert.doesNotMatch(html, /Studio GQ \| Studio GQ/i);
    assert.match(html, /studio-gq-white\.png/i);
  }
});

test("uses route-specific social URLs and optimized image assets", async () => {
  for (const route of ["/about", "/equipment", "/gallery", "/faq", "/contact"]) {
    const response = await fetchSite(route, { headers: { accept: "text/html" } });
    const html = await response.text();
    assert.match(html, new RegExp(`<meta property="og:url" content="https://www\\.studiogq\\.co\\.za${route}"`, "i"));
  }

  const homepage = await (await fetchSite("/", { headers: { accept: "text/html" } })).text();
  assert.match(homepage, /hero-studio-gq\.webp/i);
  assert.doesNotMatch(homepage, /studio-gq-white-transparent\.svg/i);
});
