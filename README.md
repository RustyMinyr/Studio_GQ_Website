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

The App Router source is compatible with Vercel. The repository also retains the vinext/Sites adapter used for the included private deployment workflow.

## Supabase booking system

The booking area loads occupied studio slots from `/api/availability` and submits reservations to `/api/bookings`. Customer details stay server-side. Supabase stores one booking record plus unique morning and afternoon slot rows, so morning, afternoon, and full-day reservations cannot overlap.

To connect a Supabase project:

1. Run the SQL migration in `supabase/migrations/` through the Supabase SQL editor.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as server-side environment variables using `.env.example` as the reference.
3. Restart the local server or redeploy the site.

The service-role key must never be exposed through a `NEXT_PUBLIC_` variable or committed to source control. If the database is not configured, the calendar reports that live availability is unavailable and the API refuses to create a booking rather than presenting unverified dates as open.

Published studio rates are R2,500 for a four-hour morning or afternoon session and R4,500 for a ten-hour full day, excluding gear.

## Content and assets

The site uses only supplied Studio GQ photography and final stacked logo files. The authoritative mapping and component contracts are documented in `ARCHITECTURE.md`.

The supplied imagery does not include distinct greenscreen, podcast-room, or meeting-room photographs. Those spaces are described in copy without misrepresenting unrelated imagery.

## Main route

- `/` — single-page Studio GQ experience with hero, services, about, equipment, studio imagery, FAQ and booking sections
- Legacy marketing URLs redirect to their matching homepage section; gallery redirects to the homepage
- `/privacy` and `/terms` remain separate legal routes

## Deployment

For Vercel, import the repository and use the default framework settings. Add real delivery credentials only after selecting a form provider. Canonical metadata is configured for `https://www.studiogq.co.za`.
