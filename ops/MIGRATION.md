# Studio GQ on Coolify

## Application and data

Next.js serves the existing marketing pages, booking calendar, enquiry forms and shared crew portal. The source deployment is GitHub `RustyMinyr/Studio_GQ_Website`, Vercel project `studio-gq-website`, commit `7d714c2ac3b92dd16cfaefb8314c86e2ff9098e8`. Preserve the canonical host `https://www.studiogq.co.za` and all routes.

SQLite is appropriate for the single studio's transactional reservations. Unique date/slot constraints prevent double bookings; multi-day writes are atomic. The four source tables contain bookings, groups, slot reservations and calendar blocks. The shared crew identity and HMAC session key are environment settings, with no separate customer authentication provider or password-reset flow. Source accounts do not need password-hash conversion.

No persistent upload store, payments or scheduled platform functions were found in code. PDF quotes are checked and sent as email attachments, not stored. Photography, logos and videos are Git assets. Resend sends notifications and enquiries. Forjdeck routes exist but their credentials are absent from the live Vercel configuration; keep them disabled unless intentionally enabled.

## Runtime

Use this repository's Dockerfile and Node 24. Run as UID 1000, one application writer, with this site's own persistent `/app/data` mount and dedicated Docker network. The database is restored before startup; a missing file fails closed. Never configure Turso credentials in the migrated runtime.

Required: `STUDIO_DATABASE_PATH`, `APP_ORIGIN`, shared crew settings and the three booking email settings. Set `TRUST_COOLIFY_PROXY=1` only when Traefik appends/overwrites the real peer and does not trust forwarded headers from arbitrary clients. Staging has no public domain and `EMAIL_DELIVERY_DISABLED=1`. Never publish its container ports beyond loopback or Tailscale.

## Release workflow

GitHub Actions checks builds, lint, types, runtime advisories, isolated booking/authentication tests and the Docker build. The migration branch is `codex/studio-gq-coolify`. After private verification, promote the reviewed commit to `main`, select `main` in production Coolify, deploy that commit and confirm `/api/health` reports the full intended SHA. Future changes follow the same checked GitHub → Coolify sequence. Keep credentials and client data out of commits and build arguments.

## Copy and cutover

`scripts/migrate-local-database.mjs export .migration/name.db` takes a consistent read transaction, preserves source schema and values, and compares every table count and canonical SHA-256 digest with the destination. Verify integrity and foreign keys. Store the evidence privately.

Before DNS: privately test the deployed container, restore encrypted off-host backup into a separate directory/database, verify data and assets, complete security review and record existing DNS. Freeze mutations on Vercel with `MIGRATION_READ_ONLY=1`; freeze only this site's four Turso tables with `scripts/migrate-local-database.mjs freeze`. Prove the freeze rejects a controlled no-op mutation, then take the final export. Replace the target only while its writer is stopped, retaining the previous snapshot, and check final digests again.

Change only apex/www web records and any relevant AAAA records at domains.co.za. Preserve all email and verification records. Confirm multiple public resolvers, trusted HTTPS, canonical redirect, login, booking persistence, email delivery/provider receipt and logs. Keep Vercel and Turso frozen and available for rollback.

## Rollback

Before new destination writes: restore recorded web DNS, remove the source freeze with `scripts/migrate-local-database.mjs thaw`, disable the Vercel maintenance flag and verify service. After destination writes: stop both writers, export and reconcile all new/changed destination records into the source first, verify relationships/counts, then switch DNS and unfreeze the chosen authority. Never activate two writers. Do not delete old hosting/data or cancel subscriptions without separate approval.

## Current verification status

Initial snapshot: 9 groups, 10 bookings, 3 slots, 0 calendar blocks. All four digests, foreign keys and integrity match. Existing crew credentials successfully authenticated on the public Vercel site. Local Next production build and isolated booking/authentication tests pass, including simultaneous slot conflict, optional production text, confirm/reschedule/cancel, calendar blocking, CSRF, cookie attributes, invalid PDF rejection and persistent login limiting. Production npm audit reports zero runtime vulnerabilities.

Migration is not complete until deployed private checks, off-server restore, production email, monitoring and final DNS/public verification are recorded. This document does not itself certify those pending steps.
