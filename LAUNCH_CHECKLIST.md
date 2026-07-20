# Studio GQ launch checklist

The website is designed to remain in safe preview mode until the live booking database and production domain are connected. Complete these steps before public launch.

## 1. Connect Turso

1. Create the `studio-gq-bookings` database in Turso (Mumbai region).
2. Add these server-only runtime values to Vercel and `.env.local`:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `CREW_PORTAL_EMAIL`
   - `CREW_PORTAL_PASSWORD`
   - `CREW_SESSION_SECRET`
3. Run `npm run turso:migrate` once and confirm it succeeds.
4. Confirm that `/api/availability` reports `configured: true`.
5. Submit one test booking, verify the booking and both reserved slots in Turso, then cancel the test booking and verify that its slots are released.

## 1.1 Enable booking notifications

1. Add Resend to the Vercel project and verify the `studiogq.co.za` sending domain.
2. Add `RESEND_API_KEY` and `BOOKING_FROM_EMAIL` as server-only environment variables.
3. Set `BOOKING_NOTIFICATION_EMAIL=booking@studiogq.co.za` in every deployment environment.
4. Submit a test booking and confirm that the Studio GQ notification email arrives.

Never expose the Turso token, crew password, or session secret in a `NEXT_PUBLIC_` variable, browser code, screenshots, or support messages.

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
