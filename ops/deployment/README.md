# Release tooling

The active workflow builds, tests and publishes immutable images. Deployment
currently runs from the local Windows Deployment workspace using
`ops/Invoke-StudioGQRelease.ps1`; Coolify credentials stay in Windows DPAPI.

`deploy-staging.future.yml` is a disabled future template, deliberately outside
`.github/workflows`. It is not installed or ready to execute automatically.
Enabling it requires explicit authorization to store Coolify API credentials in
GitHub, matching environment and Tailscale OIDC configuration, and a fresh
review/live staging acceptance test. Do not move it into workflows as part of
ordinary site updates. It trusts only main and has no production target.

The sibling standard-library client and provenance helper are a pinned template
copy for that future workflow. `sites.json` identifies only Studio GQ staging.
`CLIENT.md` documents the generic release safety contract. The current local
launcher additionally seals receipt provenance with the Windows user's DPAPI
key; local recovery is independent of GitHub workflow receipts.
