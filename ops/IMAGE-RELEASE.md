# Studio GQ image releases

Run **Publish verified Studio GQ image** manually from the intended Git ref. The workflow runs the existing Coolify checks first, transfers their exact Docker image through a one-day Actions artifact, verifies its source revision and Linux AMD64 platform, then publishes it to `ghcr.io/rustyminyr/studio_gq_website` using the job's temporary `GITHUB_TOKEN`. It does not rebuild the image or request a Coolify deployment.

Each tag contains the full source commit, Actions run ID and run attempt. Rebuilding the same commit produces a separate tag. Download the `studio-gq-release-...` artifact and retain `release.json` with the deployment record; its `image_reference` pins the exact registry digest. Use that reference for promotion and rollback, and retain the corresponding registry image.

Package visibility is not changed by the workflow. Keep the package private during the pilot; the deployment server needs a separately configured credential that can pull it. Publishing permission and server pull permission are independent.

## Staging pilot

Use the existing `studio-gq-staging` application and its own network and database mount. Preserve its private access, disabled email and single-writer replacement settings. Record the previous image reference and runtime configuration before changing the image. Deploy only after the image workflow succeeds, and verify container health, database readiness, release identity and the affected page/booking flows. Roll back to the recorded image and verify the same checks while preserving the data mount.

The image bakes the source commit into `SOURCE_COMMIT` and the OCI revision label. A Coolify runtime `SOURCE_COMMIT` overrides the baked value: remove that runtime override when moving to an image deployment, or update it to the exact `source_commit` in `release.json` on every promotion and rollback. Compare `/api/health` with the expected full SHA and independently compare the deployed image with the recorded digest.

The deployment client should consume `image_reference` and `source_commit` from `release.json`, save the prior deployment record, and poll the deployment through completion before running verification. Publication alone is not a successful release. An application-image rollback does not restore or reverse database data.

## Existing checks

`.github/workflows/coolify.yml` remains the source of the required npm audit, lint, type, build, isolated SQLite authentication/booking and Docker checks. It supports both its existing push/pull-request triggers and reuse by the image workflow. Runtime credentials, production databases and uploaded files are not needed to publish the image.

Use `tests/deployed-readonly.mjs <allowed-origin> <full-commit>` for the existing public page, asset and security checks. Review its allowed origins before using a new staging address. The production booking helper's `persistence` mode verifies retained synthetic records; its initial test mode sends mail and creates bookings and is not a routine deployment check.
