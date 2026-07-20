# Studio GQ launch checklist

The website is designed to remain in safe preview mode until the live booking database and production domain are connected. Complete these steps before public launch.

## 1. Connect Supabase

1. Create or select the Studio GQ Supabase project.
2. Apply the migrations in order:
   - `202607160001_create_studio_bookings.sql`
   - `202607160002_harden_booking_lifecycle.sql`
   - `202607170001_add_crew_booking_management.sql`
3. Add these public runtime values to the deployed site:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Add these server-only runtime values to the deployed site:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `CREW_PORTAL_EMAIL`
5. Create the shared crew identity in Supabase Auth using the same email as `CREW_PORTAL_EMAIL`.
6. Confirm that `/api/availability` reports `configured: true`.
7. Submit one test booking, verify the booking and both reserved slots in Supabase, then cancel the test booking and verify that its slots are released.

Never expose the service-role key in a `NEXT_PUBLIC_` variable, browser code, screenshots, or support messages.

## 2. Confirm the operating workflow

- New website requests are stored as `pending` and reserve the selected slot.
- Repeated delivery of the same browser request is idempotent and returns the original booking instead of creating a duplicate.
- Use the crew portal at `/crew` to review, confirm, reschedule or cancel requests, manage internal calendar blocks, and prepare client emails.
- Decide how quickly pending requests must be reviewed and when an unanswered hold should be cancelled.
- Connect a studio notification and customer acknowledgement workflow before relying on the database for unattended enquiries.

## 3. Public-booking protection

- Add a durable rate limiter and bot challenge before opening database-backed booking to unrestricted public traffic.
- Keep the current same-origin, validation, honeypot, payload-size and per-instance rate controls enabled as additional layers.
- Confirm the maximum advance-booking window and same-day cutoff policy with the studio team.

## 4. Domain and search launch

1. Connect `www.studiogq.co.za` to the new deployment.
2. Remove or archive the old Squarespace site only after the new domain is verified.
3. Verify HTTPS and the expected content at:
   - `/`
   - `/booking`
   - `/sitemap.xml`
   - `/robots.txt`
   - `/og.png`
4. Confirm that canonical and social URLs resolve to the new site.
5. Submit the sitemap to the relevant search-console account.

## 5. Final content checks

- Confirm the official Facebook and YouTube profile URLs before adding them to the footer.
- Add a WebVTT captions track or transcript if the studio overview video contains narration or other meaningful speech.
- Have Studio GQ review the booking terms, retention wording and privacy policy for POPIA and business-policy accuracy.
