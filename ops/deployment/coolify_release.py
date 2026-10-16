#!/usr/bin/env python3
"""Small, standard-library release client. See tools/README.md for the contract.

Coolify's PATCH + deploy API is not an atomic compare-and-swap operation. CI must
serialize releases per application and all other deployment writers must stop.
Mutations are never retried. Receipts must be retained even on failed CI jobs.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import time
from urllib import error, parse, request
import uuid


SCHEMA = 1
MAX_RESPONSE = 2 * 1024 * 1024
TERMINAL = {"finished", "failed", "cancelled", "canceled", "cancelled-by-user"}
ACTIVE = {"queued", "in_progress", "pending"}
COMMIT = re.compile(r"[0-9a-f]{40}\Z")
DIGEST = re.compile(r"sha256:[0-9a-f]{64}\Z")
STORED_DIGEST = re.compile(r"sha256-[0-9a-f]{64}\Z")
COMMIT_TAG = re.compile(r"(?:sha-)?[0-9a-f]{40}(?:-[0-9]+-[0-9]+)?\Z")
IDENTIFIER = re.compile(r"[A-Za-z0-9_-]{1,100}\Z")


class ReleaseError(Exception):
    """Safe, deliberately non-secret error suitable for CI output."""


class TransportError(ReleaseError):
    def __init__(self, status=None):
        self.status = status
        super().__init__(f"HTTP request failed (status {status}); response omitted"
                         if status else "HTTP request failed; transport details omitted")

    @property
    def retryable(self):
        return self.status is None or self.status in {408, 429, 500, 502, 503, 504}


def require(condition, message):
    if not condition:
        raise ReleaseError(message)


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def valid_url(url, allow_private_http=False):
    require(isinstance(url, str) and not any(c.isspace() for c in url), "Invalid URL")
    try:
        parts = parse.urlsplit(url)
        port = parts.port
    except ValueError:
        raise ReleaseError("Invalid URL") from None
    require(parts.hostname and not parts.username and not parts.password
            and not parts.fragment and not parts.query, "URL must not contain credentials, query, or fragment")
    require(port is None or 0 < port < 65536, "Invalid URL port")
    private = False
    try:
        addr = ipaddress.ip_address(parts.hostname)
        private = addr.is_private or addr in ipaddress.ip_network("100.64.0.0/10")
    except ValueError:
        private = parts.hostname.endswith(".ts.net")
    require(parts.scheme == "https" or
            (parts.scheme == "http" and allow_private_http and private),
            "HTTPS required; private HTTP needs explicit allow_private_http and a private IP or ts.net host")
    return url.rstrip("/")


class NoRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Http:
    """No redirects, implicit proxies, raw response logs, or automatic retries."""
    def __init__(self, base_url, read_token, write_token=None, timeout=30):
        self.base_url = base_url
        self.read_token = read_token
        self.write_token = write_token
        self.timeout = timeout
        self.opener = request.build_opener(request.ProxyHandler({}), NoRedirect())

    def _fetch(self, url, method="GET", token=None, body=None, timeout=None):
        headers = {"Accept": "application/json", "Cache-Control": "no-cache",
                   "User-Agent": "coolify-release/1"}
        if token:
            headers["Authorization"] = "Bearer " + token
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body, separators=(",", ":")).encode("utf-8")
        try:
            req = request.Request(url, data=data, headers=headers, method=method)
            with self.opener.open(req, timeout=min(self.timeout, timeout or self.timeout)) as response:
                # Defense in depth if an opener is changed: no token can be redirected.
                require(response.geturl() == url, "Redirected response rejected")
                require(200 <= response.status < 300, "Unexpected HTTP response status")
                payload = response.read(MAX_RESPONSE + 1)
                require(len(payload) <= MAX_RESPONSE, "HTTP response exceeded size limit")
                return response.status, payload
        except error.HTTPError as exc:
            raise TransportError(exc.code) from None
        except (error.URLError, TimeoutError, OSError, ValueError):
            raise TransportError() from None

    def api(self, method, path, body=None, timeout=None):
        require(re.fullmatch(r"/[A-Za-z0-9_/-]+", path) and ".." not in path and "//" not in path,
                "Invalid API path")
        require(method in {"GET", "PATCH", "POST"}, "Unsupported API method")
        token = self.read_token if method == "GET" else self.write_token
        require(isinstance(token, str) and token and not any(c.isspace() for c in token),
                "Required API token is missing or invalid")
        _, payload = self._fetch(self.base_url + path, method, token, body, timeout)
        try:
            return json.loads(payload)
        except (ValueError, UnicodeError):
            raise ReleaseError("API returned invalid JSON; response omitted") from None

    def public(self, url, timeout=None):
        return self._fetch(url, timeout=timeout)


def load_json(path):
    try:
        value = json.loads(Path(path).read_text(encoding="utf-8-sig"))
        require(isinstance(value, dict), "Expected a JSON object")
        return value
    except (OSError, ValueError, UnicodeError):
        raise ReleaseError("Could not read JSON input") from None


def config_for(path, site, repository):
    config = load_json(path)
    require(config.get("schema_version") == SCHEMA, "Unsupported configuration schema")
    sites = config.get("sites", {})
    require(isinstance(sites, dict) and site in sites, "Site is not in the configuration allowlist")
    cfg = sites[site]
    require(isinstance(cfg, dict), "Invalid site configuration")
    require(re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository or ""), "Invalid repository identity")
    require(repository == cfg.get("repository"), "Repository does not match the allowlisted site")
    require(IDENTIFIER.fullmatch(cfg.get("application_uuid", "")), "Invalid application UUID")
    require(re.fullmatch(r"[a-z0-9.-]+(?::[0-9]+)?/[a-z0-9._/-]+", cfg.get("image", "")), "Invalid image name")
    expected = cfg.get("expected_fields")
    require(isinstance(expected, dict) and "name" in expected and "build_pack" in expected,
            "expected_fields must explicitly identify name and build_pack")
    require(expected["build_pack"] == "dockerimage", "Only prebuilt Docker Image applications are supported")
    require(set(expected) <= {"name", "build_pack", "git_repository", "git_branch", "destination_id", "environment_id"},
            "Unsupported identity field")
    require(isinstance(cfg.get("expected_server_id"), int) and cfg["expected_server_id"] >= 0
            and isinstance(expected.get("destination_id"), int),
            "Explicit expected_server_id and destination_id are required")
    require(cfg.get("image_reference_mode") in {"digest", "commit-tag"}, "Choose digest or commit-tag image_reference_mode")
    allow_http = config.get("allow_private_http") is True
    base = valid_url(config.get("coolify_api_url"), allow_http)
    require(parse.urlsplit(base).path == "/api/v1", "Coolify API URL must end with /api/v1")
    verification = cfg.get("verification")
    require(isinstance(verification, dict), "Health and version verification configuration is required")
    for key in ("health_url", "version_url"):
        valid_url(verification.get(key), allow_http)
    require(re.fullmatch(r"[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*", verification.get("json_key", "commit")),
            "Invalid version JSON field path")
    return base, cfg


def save_receipt(path, receipt, new=False):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode("utf-8")
    if new:
        try:
            with path.open("xb") as output:
                output.write(data)
                output.flush()
                os.fsync(output.fileno())
        except FileExistsError:
            raise ReleaseError("Receipt already exists; use resume, never repeat deploy") from None
    else:
        fd, temporary = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
        try:
            with os.fdopen(fd, "wb") as output:
                output.write(data)
                output.flush()
                os.fsync(output.fileno())
            os.replace(temporary, path)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
    # Durably persist directory entries on platforms that provide directory fsync.
    if os.name == "posix":
        fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)


@contextmanager
def receipt_lock(path):
    lock = Path(str(path) + ".lock")
    lock.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        raise ReleaseError("Receipt is locked; inspect the owning process before removing a stale lock") from None
    os.close(fd)
    try:
        yield
    finally:
        lock.unlink()


def identity_hash(cfg):
    # Bind recovery to the reviewed site definition, including verification URLs.
    return hashlib.sha256(json.dumps(cfg, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


class ReleaseClient:
    def __init__(self, api, cfg, site, *, timeout=900, interval=5, clock=time.monotonic, sleep=time.sleep):
        require(0 < timeout <= 7200 and 0 < interval <= 60, "Invalid timeout or poll interval")
        self.api, self.cfg, self.site = api, cfg, site
        self.timeout, self.interval, self.clock, self.sleep = timeout, interval, clock, sleep
        self.app_path = "/applications/" + cfg["application_uuid"]

    def app(self, tag=None, timeout=None):
        value = self.api.api("GET", self.app_path, timeout=timeout)
        require(isinstance(value, dict), "Unexpected application response")
        require(value.get("uuid") == self.cfg["application_uuid"], "Application UUID mismatch")
        require(value.get("docker_registry_image_name") == self.cfg["image"], "Application image mismatch")
        for key, expected in self.cfg["expected_fields"].items():
            require(key in value and value[key] == expected, "Application identity mismatch: " + key)
        destination = value.get("destination", {})
        require(destination.get("server_id") == self.cfg["expected_server_id"],
                "Application server identity mismatch")
        # Coolify's read-token response omits the application's numeric ID. Its
        # UUID-scoped history is the authoritative bridge to deployment rows.
        history = self.api.api("GET", "/deployments/applications/" + self.cfg["application_uuid"], timeout=timeout)
        rows = history.get("deployments") if isinstance(history, dict) else None
        require(isinstance(rows, list) and rows, "Application needs verified deployment history before release")
        ids = set()
        for row in rows:
            require(isinstance(row, dict) and str(row.get("application_id", "")).isdigit(),
                    "Unrecognized scoped deployment identity")
            require(str(row.get("server_id")) == str(self.cfg["expected_server_id"])
                    and str(row.get("destination_id")) == str(self.cfg["expected_fields"]["destination_id"]),
                    "Scoped deployment server or destination mismatch")
            ids.add(str(row["application_id"]))
        require(len(ids) == 1, "Scoped history contains ambiguous application IDs")
        numeric_id = ids.pop()
        require("id" not in value or str(value["id"]) == numeric_id, "Application numeric ID disagrees with scoped history")
        value["id"] = numeric_id
        require(value.get("settings", {}).get("is_auto_deploy_enabled") is False,
                "Competing automatic deployments must be explicitly disabled")
        if tag is not None:
            require(value.get("docker_registry_image_tag") == tag, "Application image tag changed; release stopped")
        return value

    def no_active(self, app):
        rows = self.api.api("GET", "/deployments")
        require(isinstance(rows, list), "Unexpected active deployments response")
        for row in rows:
            require(isinstance(row, dict) and "application_id" in row, "Unrecognized deployment identity")
            if str(row["application_id"]) == str(app["id"]):
                require(row.get("status") in TERMINAL, "Application already has an active or unknown deployment")

    def version(self, timeout=None):
        verification = self.cfg["verification"]
        status, _ = self.api.public(verification["health_url"], timeout=timeout)
        require(status == 200, "Health check did not return HTTP 200")
        status, payload = self.api.public(verification["version_url"], timeout=timeout)
        require(status == 200, "Version check did not return HTTP 200")
        try:
            value = json.loads(payload)
            for key in verification.get("json_key", "commit").split("."):
                value = value[key]
        except (ValueError, UnicodeError, KeyError, TypeError):
            raise ReleaseError("Version response did not contain the configured commit field") from None
        require(isinstance(value, str) and COMMIT.fullmatch(value), "Version endpoint must return a full lowercase Git commit SHA")
        return value

    def preflight(self, current_tag, *, prior_commit=None):
        require(isinstance(current_tag, str) and
                (STORED_DIGEST.fullmatch(current_tag) or COMMIT_TAG.fullmatch(current_tag)),
                "Expected current tag must be a pinned sha256- digest or full commit tag")
        app = self.app(current_tag)
        self.no_active(app)
        observed = prior_commit or self.version()
        require(COMMIT.fullmatch(observed), "Missing previous commit identity")
        if COMMIT_TAG.fullmatch(current_tag):
            tagged_commit = current_tag.removeprefix("sha-")[:40]
            require(tagged_commit == observed, "Current image tag and live commit disagree")
        return app, observed

    def _state(self, path, receipt, state, **fields):
        receipt.update(fields)
        receipt.update(state=state, updated_at=utc_now())
        save_receipt(path, receipt)

    def _receipt_matches(self, receipt):
        require(receipt.get("schema_version") == SCHEMA and
                receipt.get("site") == self.site and
                receipt.get("api_url") == self.api.base_url and
                receipt.get("application_uuid") == self.cfg["application_uuid"] and
                receipt.get("repository") == self.cfg["repository"] and
                receipt.get("image") == self.cfg["image"] and
                receipt.get("configuration_sha256") == identity_hash(self.cfg),
                "Receipt identity does not match the approved configuration")
        for key in ("prior_tag", "target_tag"):
            value = receipt.get(key, "")
            require(STORED_DIGEST.fullmatch(value) or COMMIT_TAG.fullmatch(value), "Invalid receipt image identity")
        require(COMMIT.fullmatch(receipt.get("target_commit", "")) and
                COMMIT.fullmatch(receipt.get("prior_commit", "")), "Invalid receipt commit identity")

    def deploy(self, current_tag, candidate_tag, digest, commit, receipt_path):
        require(COMMIT.fullmatch(commit or ""), "Candidate commit must be a full lowercase Git SHA")
        require(isinstance(candidate_tag, str) and
                re.fullmatch(r"(?:sha-)?" + re.escape(commit) + r"(?:-[0-9]+-[0-9]+)?", candidate_tag),
                "Candidate tag must identify exactly the candidate commit, optionally followed by run and attempt numbers")
        require(DIGEST.fullmatch(digest or ""), "Candidate digest must be sha256 plus 64 lowercase hex characters")
        target = digest.replace("sha256:", "sha256-", 1) if self.cfg["image_reference_mode"] == "digest" else candidate_tag
        with receipt_lock(receipt_path):
            require(not Path(receipt_path).exists(), "Receipt already exists; use resume, never repeat deploy")
            app, prior_commit = self.preflight(current_tag)
            require(target != current_tag, "Candidate is already configured; inspect existing deployment instead")
            receipt = self._new_receipt(app, current_tag, prior_commit, target, commit,
                                        candidate_tag=candidate_tag, candidate_digest=digest)
            return self._run_new(receipt_path, receipt)

    def _new_receipt(self, app, current_tag, prior_commit, target, commit, **metadata):
        return dict(schema_version=SCHEMA, release_id=str(uuid.uuid4()), site=self.site,
                    api_url=self.api.base_url, application_uuid=self.cfg["application_uuid"],
                    application_id=str(app["id"]), repository=self.cfg["repository"],
                    server_id=str(self.cfg["expected_server_id"]),
                    destination_id=str(self.cfg["expected_fields"]["destination_id"]),
                    image=self.cfg["image"], configuration_sha256=identity_hash(self.cfg),
                    prior_tag=current_tag, prior_commit=prior_commit, target_tag=target,
                    target_commit=commit, created_at=utc_now(), state="prepared", **metadata)

    def _run_new(self, path, receipt):
        save_receipt(path, receipt, new=True)
        # Validate again after durably recording the previous release.
        app = self.app(receipt["prior_tag"])
        self.no_active(app)
        self._state(path, receipt, "patch_requested")
        self.api.api("PATCH", self.app_path, {"docker_registry_image_tag": receipt["target_tag"]})
        self._state(path, receipt, "configured")
        app = self.app(receipt["target_tag"])
        self.no_active(app)
        self._state(path, receipt, "trigger_requested", trigger_requested_at=utc_now())
        result = self.api.api("POST", "/deploy", {"uuid": self.cfg["application_uuid"], "force": False})
        rows = result.get("deployments") if isinstance(result, dict) else None
        require(isinstance(rows, list) and len(rows) == 1 and
                rows[0].get("resource_uuid") == self.cfg["application_uuid"] and
                IDENTIFIER.fullmatch(rows[0].get("deployment_uuid", "")),
                "Deploy response is ambiguous; use resume and inspect, never retry the trigger")
        self._state(path, receipt, "deploying", deployment_uuid=rows[0]["deployment_uuid"])
        return self.poll(path, receipt)

    def deployment(self, receipt, timeout=None):
        identifier = receipt.get("deployment_uuid", "")
        require(isinstance(identifier, str) and IDENTIFIER.fullmatch(identifier), "Missing or invalid deployment UUID")
        row = self.api.api("GET", "/deployments/" + identifier, timeout=timeout)
        require(isinstance(row, dict) and row.get("deployment_uuid") == identifier and
                str(row.get("application_id")) == receipt["application_id"], "Deployment identity mismatch")
        require(str(row.get("server_id")) == receipt.get("server_id") == str(self.cfg["expected_server_id"])
                and str(row.get("destination_id")) == receipt.get("destination_id")
                == str(self.cfg["expected_fields"]["destination_id"]), "Deployment server or destination mismatch")
        require(row.get("pull_request_id") in {0, "0"}, "Preview or unidentified deployment cannot verify production")
        recorded_tag = row.get("docker_registry_image_tag")
        if recorded_tag is None:
            # Coolify 4.4.6 stores docker_tag only for previews. Normal image
            # deployments resolve the application's configured tag/digest.
            require(self.cfg["expected_fields"].get("build_pack") == "dockerimage",
                    "Missing image tag is supported only for Docker Image deployments")
            try:
                created = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
                triggered = datetime.fromisoformat(receipt["trigger_requested_at"])
                require(-30 <= (created - triggered).total_seconds() <= 300,
                        "Deployment time does not match the recorded trigger")
            except (AttributeError, KeyError, TypeError, ValueError):
                raise ReleaseError("Cannot verify deployment creation time") from None
        else:
            require(recorded_tag == receipt["target_tag"], "Deployment image identity mismatch")
        return row

    def poll(self, path, receipt):
        deadline = self.clock() + self.timeout
        while self.clock() < deadline:
            remaining = max(0.001, deadline - self.clock())
            try:
                row = self.deployment(receipt, timeout=remaining)
                status = row.get("status")
                require(status in TERMINAL | ACTIVE, "Unknown deployment status; inspect without retriggering")
                if status in TERMINAL and status != "finished":
                    self._state(path, receipt, "deployment_failed", deployment_status=status)
                    raise ReleaseError("Deployment failed or was cancelled; receipt retained for explicit recovery")
                if status == "finished":
                    self._state(path, receipt, "verifying", deployment_status=status)
                    app = self.app(receipt["target_tag"], timeout=max(0.001, deadline - self.clock()))
                    try:
                        observed = self.version(timeout=max(0.001, deadline - self.clock()))
                    except ReleaseError:
                        observed = None
                    if app.get("status") == "running:healthy" and observed == receipt["target_commit"]:
                        reference = (receipt["image"] + "@" + receipt["target_tag"].replace("sha256-", "sha256:", 1)
                                     if STORED_DIGEST.fullmatch(receipt["target_tag"])
                                     else receipt["image"] + ":" + receipt["target_tag"])
                        self._state(path, receipt, "verified", verified_at=utc_now(),
                                    verification_method="finished_deployment_configured_image_and_live_commit",
                                    configured_image_reference=reference, runtime_digest_inspected=False)
                        return receipt
            except TransportError as exc:
                if not exc.retryable:
                    raise
            self.sleep(min(self.interval, max(0, deadline - self.clock())))
        self._state(path, receipt, "timed_out")
        raise ReleaseError("Deployment or live verification timed out; resume only, do not trigger again")

    def resume(self, receipt_path, deployment_uuid=None):
        with receipt_lock(receipt_path):
            receipt = load_json(receipt_path)
            self._receipt_matches(receipt)
            app = self.app()
            require(str(app["id"]) == receipt["application_id"], "Application numeric ID changed")
            if deployment_uuid:
                require(receipt.get("deployment_uuid") in {None, deployment_uuid}, "Cannot replace a recorded deployment UUID")
                require(receipt.get("state") == "trigger_requested" or receipt.get("deployment_uuid") == deployment_uuid,
                        "A deployment UUID can only resolve an uncertain trigger")
                receipt["deployment_uuid"] = deployment_uuid
                row = self.deployment(receipt)
                # A supplied ID must belong to this attempt, not an old matching release.
                try:
                    created = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
                    triggered = datetime.fromisoformat(receipt["trigger_requested_at"])
                    require(abs((created - triggered).total_seconds()) <= 300,
                            "Deployment time does not match the uncertain trigger")
                except (KeyError, TypeError, ValueError):
                    raise ReleaseError("Cannot verify deployment creation time") from None
                self._state(receipt_path, receipt, "deploying")
            require(receipt.get("deployment_uuid"),
                    "No known deployment UUID. Inspect Coolify history and current tag; resume never sends PATCH or POST")
            return self.poll(receipt_path, receipt)

    def rollback(self, receipt_path, rollback_path):
        require(Path(receipt_path).resolve() != Path(rollback_path).resolve(), "Rollback needs a separate receipt")
        with receipt_lock(receipt_path), receipt_lock(rollback_path):
            original = load_json(receipt_path)
            self._receipt_matches(original)
            require(not Path(rollback_path).exists(), "Rollback receipt exists; resume it instead")
            require(self.deployment(original).get("status") in TERMINAL,
                    "Original deployment must be terminal before rollback")
            # A failed new release can be unhealthy. Recover the old identity from
            # its receipt instead of requiring the broken release to serve health.
            app, _ = self.preflight(original["target_tag"], prior_commit=original["target_commit"])
            receipt = self._new_receipt(app, original["target_tag"], original["target_commit"],
                                        original["prior_tag"], original["prior_commit"],
                                        rollback_of=original["release_id"])
            return self._run_new(rollback_path, receipt)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["preflight", "deploy", "resume", "rollback"])
    parser.add_argument("--config", required=True)
    parser.add_argument("--site", required=True)
    parser.add_argument("--repository", required=True, help="Expected owner/repository from the trusted CI context")
    parser.add_argument("--expected-current-tag")
    parser.add_argument("--candidate-tag")
    parser.add_argument("--candidate-digest")
    parser.add_argument("--commit")
    parser.add_argument("--receipt")
    parser.add_argument("--rollback-receipt")
    parser.add_argument("--deployment-uuid")
    parser.add_argument("--timeout", type=float, default=900)
    parser.add_argument("--interval", type=float, default=5)
    args = parser.parse_args(argv)
    try:
        base, cfg = config_for(args.config, args.site, args.repository)
        read_token = os.environ.get("COOLIFY_READ_TOKEN")
        require(read_token, "COOLIFY_READ_TOKEN is required")
        write_token = os.environ.get("COOLIFY_WRITE_TOKEN")
        if args.command in {"deploy", "rollback"}:
            require(write_token, "COOLIFY_WRITE_TOKEN with write and deploy abilities is required")
        api = Http(base, read_token, write_token)
        client = ReleaseClient(api, cfg, args.site, timeout=args.timeout, interval=args.interval)
        if args.command == "preflight":
            app, commit = client.preflight(args.expected_current_tag)
            result = {"state": "preflight_passed", "site": args.site,
                      "application_uuid": app["uuid"], "current_tag": app["docker_registry_image_tag"],
                      "current_commit": commit}
        else:
            require(args.receipt, "--receipt is required")
            if args.command == "deploy":
                result = client.deploy(args.expected_current_tag, args.candidate_tag, args.candidate_digest,
                                       args.commit, args.receipt)
            elif args.command == "resume":
                result = client.resume(args.receipt, args.deployment_uuid)
            else:
                require(args.rollback_receipt, "--rollback-receipt is required")
                result = client.rollback(args.receipt, args.rollback_receipt)
        print(json.dumps({key: result[key] for key in
                          ("state", "site", "release_id", "deployment_uuid", "current_tag", "current_commit")
                          if key in result}, sort_keys=True))
        return 0
    except ReleaseError as exc:
        print("Release stopped: " + str(exc), file=sys.stderr)
        return 1
    except (OSError, TypeError, KeyError, ValueError):
        print("Release stopped: invalid input or local I/O failure; inspect retained receipt", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
