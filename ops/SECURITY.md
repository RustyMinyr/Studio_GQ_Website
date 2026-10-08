# Migration security review — 8 October 2026

| Finding | Severity | Evidence and action |
| --- | --- | --- |
| Outdated Next.js runtime and transitive packages | Critical/High | Registry audit identified multiple advisories in 16.2.6. Upgraded to 16.4.0, applied compatible patches and constrained ws. Runtime audit now reports zero vulnerabilities; production build and application tests pass. |
| Client-supplied CF/IP headers could change login limiter identity | High | The direct origin accepted `cf-connecting-ip`. Removed that trust; proxy-aware identity uses the last trusted forwarded peer or a shared fail-closed key. Persistent local SQLite login limits survive restart. Tests vary forged CF headers and still reach 429. Verify Traefik forwarding configuration on the deployment. |
| Origin comparisons rely on internal request URL behind reverse proxy | Medium | Central explicit `APP_ORIGIN` validation now protects browser mutations. Cross-site requests return 403. |
| PDF attachment accepted based only on filename/base64 | Medium | Added PDF magic validation and rejected path/control characters; controlled fake PDF test returns 400. Quotes remain transient email attachments, with size limits and authenticated access. |
| Preview could send client mail | High operational risk | All sends stop when `EMAIL_DELIVERY_DISABLED=1`; staging has no Resend key. |
| Unbounded in-memory login counters and restart reset | Medium | Expired fallback entries pruned; local deployment uses atomic persistent counters and fails closed on database errors. |

Existing controls reviewed: parameterized SQL and transactional unique reservations; crew authentication on each management endpoint; HMAC session integrity/expiry and fixed identity; HttpOnly/Secure/SameSite cookies; strict same-origin mutations; form schema/size limits; escaped email HTML; fixed outbound Resend endpoint; protected Forjdeck signatures/organization binding; CSP, HSTS, frame blocking and MIME protection.

The shared password is kept in private runtime configuration, not a database hash. There is no public registration/account recovery feature; one shared login remains the owner's requested design. Shared credentials provide no individual audit attribution. Use a strong unique password, rotate when staff access changes and consider individual accounts if accountability becomes necessary. Credential rotation invalidates existing sessions only when the signing secret is also changed.

The retained legacy Vinext/Cloudflare development adapter has high-severity build/development dependency advisories. It is not the production container runtime and is not used by the Coolify build. Do not expose its development server or build untrusted contributions with secrets. Remove or upgrade this unused adapter in a separate reviewed cleanup; production runtime audit is independently clean.

Pending deployment evidence: filesystem permissions, network isolation, forwarded-header behavior, container privileges, secret/bundle exposure, proxy TLS/redirects, persisted login limits after container replacement, logs, encrypted remote backup and restored application, monitoring/alert receipt, real Resend delivery and final public host checks. No claim of penetration-test certification or mailbox receipt is made.
