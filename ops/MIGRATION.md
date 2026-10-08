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

## Private server evidence — 8 October 2026

- Coolify project `ngshlreibe9asl4mhm00ttg7`; staging app `i6niok9h83f4nijpfjw3o8xh`, production app `lhosiqfbxr4x6uqbwtjvetka`. Dedicated networks `studio-gq-staging` / `studio-gq-production`, mounts `/srv/studio-gq/{staging,production}/data`.
- Initial staging commit `07c1ba5080bb63c456cc0a1609aa72ef9f465477` was healthy, ran as `node`, had only its own data bind mount and no public port binding. Private browsing uses a loopback SSH tunnel, not a public preview domain.
- Verified runtime candidate `8fa929e87d092d1ff3fe74e2c6d6271b64db5a5a` passed GitHub Actions run `37746923914` and deployed successfully to both private Coolify applications. The production deployment is `mesdblw71j2m9a14jsja0daw`; staging is `uvankljjcdc6gdjriwuonhft`. Neither has public domains or port mappings, and email delivery remains disabled.
- Browser submitted two dates (20/21 October) with optional production text blank and displayed the success popup. A build-time crew setup caching defect was fixed by making protected routes dynamic. After redeployment, crew login, dashboard, confirmation, rescheduling and closing booking actions passed. Test bookings survived container replacement. A fresh browser tab recovered focus control; 390×844 mobile navigation/booking/date/session selection and 768×1024 tablet booking layout passed without horizontal overflow or console warnings/errors. Screenshots are saved under ignored `output/migration/`. Browser cancellation confirmation remains unverified; cancellation passes in the isolated automated suite.
- `tests/deployed-readonly.mjs http://localhost:3042` verified all 19 public pages, canonical/main/heading structure, redirects, unauthenticated crew protection and production security headers. All 30 deployed public assets match their source SHA-256 hashes (29,312,870 bytes). Evidence is saved privately in `.migration/deployed-evidence.json`.
- Independent encrypted Restic repository `.../Rooiko-Server/rooiko/studio-gq`, daily 03:20 SAST backup timer. Full remote read-data check and isolated restore `3970b473` passed database integrity/foreign keys, counts and all per-snapshot file SHA-256 hashes. RSA-OAEP encrypted backup key copied to ignored local `.migration/backup-password.enc`; decryption with the existing DPAPI-protected recovery authority verified without plaintext output.
- Restored application `studio-gq-restore-check` passed health, original crew password login and authenticated dashboard tests using the restored snapshot. It was then stopped and retained for inspection, with no public ports or email sends. The shared server backup excludes `/srv/studio-gq`; this site's dedicated encrypted repository is the recovery authority.
- Existing collector publishes `/var/lib/dasu-monitoring/studio-gq.json` and central inventory shows `studio-gq-staging`. It intentionally reports production as unknown before deployment. No credentials or Docker socket enter the website. Backup failure unit uses a fixed, client-data-free alert to `nimda@rooiko.com`; test accepted by existing mail transport, mailbox receipt not independently observed.
- Central inventory registration and sanitized local health/backup observations are installed. Full Studio GQ availability/error/certificate panels and outage alerts are not yet verified in the central dashboard; its existing three-site website panel was not silently expanded. Same-host checks cannot detect a complete nimda outage. Existing server resource/update panels remain in place.
- Current public apex A `216.150.1.1` (TTL 600), www CNAME `9b8538082b6bd4d7.vercel-dns-016.com` (TTL 3600); apex AAAA absent. Zoho MX records remain unchanged. Full authenticated zone export and final resolver checks remain required.
- Pending external inputs: existing `RESEND_API_KEY` / `BOOKING_FROM_EMAIL` privately in `.env.local`, and authenticated Domains.co.za browser access. Do not freeze the source or switch DNS until all gates pass.
- Vercel `main`, Turso records and DNS remain untouched. No final delta copy or write freeze has occurred. Migration commits remain on `codex/studio-gq-coolify`; the permanent production `main` deployment/webhook workflow has not yet been activated.
- Draft review PR: https://github.com/RustyMinyr/Studio_GQ_Website/pull/1. Evidence/script commit `7c874d71d089a443ee2c93f2e6783ce079567fd4` passed GitHub Actions run `37748253330`. The privately deployed runtime candidate remains `8fa929e`; subsequent commits only add operational checks and documentation.
