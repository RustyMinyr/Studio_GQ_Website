# Coolify release client

`coolify_release.py` uses Python 3.10+ and only the standard library. It supports
prebuilt **Docker Image** applications. It does not create applications, manage
credentials, execute shell commands, migrate databases, or change source builds.

Every site must be explicitly allowlisted in a reviewed JSON configuration:

```json
{
  "schema_version": 1,
  "coolify_api_url": "https://coolify.example.com/api/v1",
  "sites": {
    "example-production": {
      "application_uuid": "REPLACE_WITH_VERIFIED_UUID",
      "repository": "example/site",
      "image": "ghcr.io/example/site",
      "expected_fields": {
        "name": "Example production",
        "build_pack": "dockerimage",
        "git_repository": null,
        "destination_id": 2
      },
      "expected_server_id": 0,
      "image_reference_mode": "digest",
      "verification": {
        "health_url": "https://example.com/api/health",
        "version_url": "https://example.com/api/version",
        "json_key": "commit"
      }
    }
  }
}
```

Use the exact observed values in `expected_fields`; an absent field and a null
field differ. The version URL must return JSON containing the full 40-character
lowercase Git commit SHA, e.g. `{"commit":"..."}`. Nested keys such as
`release.commit` work. Both verification requests must return HTTP 200 and send
no authentication. Configure these application endpoints to disable caching.
No redirect is followed, including HTTP-to-HTTPS or apex-to-www redirects.
The UUID-scoped deployment history resolves Coolify's numeric application ID
when its read API omits it. History must exist, agree on that ID, and match the
allowlisted server and destination; perform first-time onboarding separately.

`digest` stores `sha256-<64 hex>` in Coolify's `docker_registry_image_tag` field,
the format documented by Coolify. Validate this behavior on your installed
Coolify version before enabling production. `commit-tag` stores `sha-<40 hex>`;
it records the digest but cannot prove the registry has not reassigned that tag.
Tags may include the unique run and attempt suffix `sha-<40 hex>-<run>-<attempt>`.
Prefer `digest`. The digest must be taken from the trusted build result; this
client does not independently authenticate the registry or check provenance.

Authentication comes only from environment variables:

- `COOLIFY_READ_TOKEN`: used for every GET; required for all commands.
- `COOLIFY_WRITE_TOKEN`: used only for PATCH and POST; must allow write and deploy.
  Required only for `deploy` and `rollback`.

URLs require HTTPS. An explicit top-level `allow_private_http: true` permits
HTTP only to private/loopback IP addresses, Tailscale IP addresses, and `.ts.net`
hosts. Use this only on a verified private encrypted route. No ambient HTTP
proxy settings are used. API paths cannot change the origin. Credentials, raw
API responses, and deployment logs are never printed or saved in receipts.

## Commands

The examples use shell variable notation for values supplied by CI; they are
not a complete workflow. Authentication values are never command arguments.

```sh
python tools/coolify_release.py preflight \
  --config config/sites.json --site example-production \
  --repository example/site --expected-current-tag "$CURRENT_TAG"

python tools/coolify_release.py deploy \
  --config config/sites.json --site example-production \
  --repository example/site --expected-current-tag "$CURRENT_TAG" \
  --candidate-tag "sha-$COMMIT" --candidate-digest "$DIGEST" --commit "$COMMIT" \
  --receipt receipts/release.json

python tools/coolify_release.py resume \
  --config config/sites.json --site example-production \
  --repository example/site --receipt receipts/release.json

python tools/coolify_release.py rollback \
  --config config/sites.json --site example-production \
  --repository example/site --receipt receipts/release.json \
  --rollback-receipt receipts/rollback.json
```

The expected current tag must be explicitly supplied as the approved previous
release, and must be a digest or full commit tag. Do not blindly copy the current
API value into the argument: that defeats drift detection. An initial migration
from a source-build or mutable `latest` deployment must be onboarded separately.
For CI, pass `--repository` from the trusted build/reusable-workflow context.

Preflight reads identity, checks for active deployments, confirms auto-deploy is
disabled, and captures the healthy previous commit. Deploy records the prior
release before changing exactly one field; then it rechecks identity, requests
exactly one deployment, and polls its UUID. Success requires the expected image
configuration, the matching deployment's finished state, health HTTP 200, and a
live version matching the intended commit. `--timeout` bounds polling (default
900 seconds, maximum 7200); `--interval` defaults to five seconds. Transient GET
failures are retried within polling. PATCH and POST are **never retried**.

Coolify 4.4.6 records a null image tag for normal deployments; `docker_tag` is
restricted to previews. The client accepts that native response only for Docker
Image applications and a deployment created within -30/+300 seconds of its
recorded trigger. Application, server, destination, healthy runtime and live
commit checks remain mandatory. Receipts name this verification method and set
`runtime_digest_inspected: false`: the API proves the configured digest and
successful release, but does not expose the running container's Docker digest.
Retain a separate Docker inspection when independent digest proof is required.

## Recovery and operating requirements

- Store receipts as durable CI artifacts **even on failure or cancellation**.
  Local receipt writes use fsync and atomic replacements; they do not make an
  ephemeral runner's filesystem permanent. Back them up externally.
- An existing receipt blocks a repeated deploy. `resume` performs only GET and
  public verification requests, even if the prior PATCH/POST outcome is unknown.
- If POST succeeded but its response was lost, inspect Coolify history. Supply
  `resume --deployment-uuid <verified-id>` to adopt the deployment. The client
  checks its app, image, production context, and creation time (within five
  minutes of the recorded trigger). It never guesses or sends another POST.
- If the receipt says `patch_requested` or `configured` without a deployment ID,
  inspect the saved application tag and history. Recovery is deliberately
  manual; do not rerun deploy with a new receipt until the uncertain attempt has
  been resolved. This is a limitation of the non-idempotent API.
- Rollback needs its own receipt, the original deployment must be terminal, and
  the current tag must still be the original candidate. It restores the recorded
  previous image and verifies the old commit. It does not restore database data
  or schema. Never roll back across an incompatible database migration.
- Receipts are trusted operational records, not signed attestations. Limit
  artifact write access. A config hash prevents accidental recovery against a
  different reviewed configuration; changing config requires explicit review.
- Serialize all releases for one app with CI concurrency. Coolify does not offer
  atomic compare-and-swap for PATCH plus deploy: checks narrow races but cannot
  eliminate them. Disable competing automatic and manual deployment writers.
  A receipt lock only coordinates local users of that one receipt.
- A process killed while holding a receipt lock can leave `<receipt>.lock`.
  Inspect for a still-running owner before removing the stale lock; do not copy
  lock files into recovery artifacts.
- This proves HTTP health and release identity, not business workflows, data
  durability, browser behavior, or database correctness. Add site-specific CI
  smoke tests and restore drills outside this client.

Run the isolated test suite (no server or credentials used):

```sh
python -m unittest discover -s ops/deployment -p 'test_*.py' -v
```

API references: [application PATCH](https://coolify.io/docs/api/endpoints/applications/update-application-by-uuid),
[deployment POST](https://coolify.io/docs/api/endpoints/deployments/deploy-by-tag-or-uuid),
[deployment GET](https://coolify.io/docs/api/endpoints/deployments/get-deployment-by-uuid),
[active deployments](https://coolify.io/docs/api/endpoints/deployments/list-deployments),
[Docker Image and digest storage](https://coolify.io/docs/applications/deployments/docker-image).
