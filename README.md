# Studio GQ website

Production-ready website for Studio GQ, a purpose-built film, photography, podcast and content production studio in Gqeberha, South Africa.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by the development server.

## Validate a production build

```bash
npm run lint
npm run build
```

The App Router runs on Next.js. `npm test` builds it and checks the booking/security flow against a new isolated test database with all email disabled. Historical Worker tests in `tests/rendered-html.test.mjs` are not part of this runtime.

## Booking system

The dedicated `/booking` portal loads occupied studio slots from `/api/availability` and submits reservations to `/api/bookings`. The homepage contact section remains a short email enquiry form. Customer details stay server-side. Site-isolated SQLite stores one booking per day plus unique morning/afternoon reservations, preventing overlaps. Do not configure Turso credentials in the new hosted runtime.

For local development:

1. Use `.env.example` as the reference. Create an empty local database with `node scripts/init-local-database.mjs .migration/local.db`, then set its absolute path as `STUDIO_DATABASE_PATH` in `.env.local`.
2. Set `APP_ORIGIN` to the exact local origin and `EMAIL_DELIVERY_DISABLED=1` for testing.
3. Set `CREW_PORTAL_EMAIL`, `CREW_PORTAL_PASSWORD`, and `CREW_SESSION_SECRET` for the one shared crew identity.
4. Restart the local server or redeploy the site.

Crew and email credentials must never use `NEXT_PUBLIC_` names or enter source control. A missing database fails closed. The Turso adapter and migration commands remain available only for the previous deployment and rollback.

Published studio rates are R2,500 for a four-hour morning or afternoon session and R4,500 for a ten-hour full day, excluding gear.

## Content and assets

The site uses only supplied Studio GQ photography and final stacked logo files. The authoritative mapping and component contracts are documented in `ARCHITECTURE.md`.

The supplied imagery does not include distinct greenscreen, podcast-room, or meeting-room photographs. Those spaces are described in copy without misrepresenting unrelated imagery.

## Main route

- `/` — single-page Studio GQ experience with hero, services, about, equipment, studio imagery, FAQ and a compact quick-enquiry section
- `/booking` — customer booking portal with live availability, session selection, rates and production details
- Legacy marketing URLs redirect to their matching homepage section; gallery redirects to the homepage
- `/privacy` and `/terms` remain separate legal routes

## Deployment

The Coolify migration workflow and its current verification status are documented in [ops/MIGRATION.md](ops/MIGRATION.md). Use the included Dockerfile for self-hosting and a dedicated persistent SQLite mount. See [ops/SECURITY.md](ops/SECURITY.md) for the security review and remaining verification requirements.

Canonical metadata remains `https://www.studiogq.co.za`. Keep old Vercel/Turso resources until the migration gates and rollback window are complete.
