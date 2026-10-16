#!/usr/bin/env python3
"""Validate GitHub artifact provenance before handing a release to Coolify.

Only JSON data is read from an artifact. No downloaded code is executed. The
fixed repository, main branch, workflow paths and site are intentional fences.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
from urllib import error, parse, request
import zipfile

from coolify_release import (COMMIT, COMMIT_TAG, DIGEST, IDENTIFIER, STORED_DIGEST,
                             Http, ReleaseClient, ReleaseError, config_for,
                             identity_hash, load_json, require, save_receipt)


REPOSITORY = "RustyMinyr/Studio_GQ_Website"
SITE = "studio-gq-staging"
IMAGE = "ghcr.io/rustyminyr/studio_gq_website"
PUBLISH_WORKFLOW = ".github/workflows/publish-image.yml"
DEPLOY_WORKFLOW = ".github/workflows/deploy-staging.yml"
CONFIG = Path(__file__).with_name("sites.json")
MAX_JSON = 128 * 1024
OPERATIONS = {"deploy", "resume", "rollback"}


def numeric(value):
    require(isinstance(value, (str, int)) and re.fullmatch(r"[1-9][0-9]{0,19}", str(value)),
            "Run, attempt, and artifact IDs must be positive integers")
    return str(value)


def context(env=os.environ):
    require(env.get("GITHUB_REPOSITORY") == REPOSITORY and env.get("GITHUB_REF") == "refs/heads/main",
            "Deployment workflow must run in the approved repository on main")
    require(env.get("GITHUB_WORKFLOW_REF") == REPOSITORY + "/" + DEPLOY_WORKFLOW + "@refs/heads/main",
            "Unexpected deployment workflow identity")
    require(COMMIT.fullmatch(env.get("GITHUB_SHA", "")), "Invalid workflow commit")
    return {"repository": REPOSITORY, "workflow_path": DEPLOY_WORKFLOW,
            "workflow_sha": env["GITHUB_SHA"], "run_id": numeric(env.get("GITHUB_RUN_ID")),
            "attempt": numeric(env.get("GITHUB_RUN_ATTEMPT"))}


def parse_inputs(env=os.environ):
    ctx = context(env)
    operation = env.get("RELEASE_OPERATION", "")
    require(operation in OPERATIONS, "Unknown operation")
    if operation != "resume":
        require(ctx["attempt"] == "1", "Never rerun a mutation job; start a new resume operation with its receipt")
    previous = env.get("EXPECTED_CURRENT_TAG", "")
    deployment_uuid = env.get("RECOVER_DEPLOYMENT_UUID", "")
    if operation == "deploy":
        require(STORED_DIGEST.fullmatch(previous) or COMMIT_TAG.fullmatch(previous),
                "Deploy requires the explicitly approved current digest or commit tag")
        require(not deployment_uuid, "Deployment UUID is only valid for resume")
    else:
        require(not previous, "Expected current tag is only valid for deploy")
        require(operation == "resume" or not deployment_uuid, "Deployment UUID is only valid for resume")
    require(not deployment_uuid or IDENTIFIER.fullmatch(deployment_uuid), "Invalid recovery deployment UUID")
    return {"operation": operation, "source_run_id": numeric(env.get("SOURCE_RUN_ID")),
            "source_attempt": numeric(env.get("SOURCE_RUN_ATTEMPT")),
            "expected_current_tag": previous, "deployment_uuid": deployment_uuid,
            "context": ctx}


class GitHub:
    def __init__(self, token):
        require(isinstance(token, str) and token and not any(c.isspace() for c in token),
                "GH_TOKEN is required for provenance reads")
        self.token = token
        self.http = Http("https://api.github.com", token)

    def get(self, path):
        # Every path is assembled below from constants and validated identifiers.
        parts = parse.urlsplit(path)
        require(path.startswith("/repos/" + REPOSITORY + "/") and not parts.scheme and not parts.netloc
                and not parts.fragment and not any(segment in {".", ".."} for segment in parts.path.split("/"))
                and re.fullmatch(r"/[A-Za-z0-9_./-]+", parts.path)
                and (not parts.query or re.fullmatch(r"per_page=100&page=[1-9][0-9]*", parts.query)),
                "GitHub request outside the approved repository")
        _, payload = self.http._fetch("https://api.github.com" + path, "GET", self.token)
        try:
            return json.loads(payload)
        except (ValueError, UnicodeError):
            raise ReleaseError("GitHub returned invalid JSON; body omitted") from None

    def archive(self, artifact_id):
        url = "https://api.github.com/repos/" + REPOSITORY + "/actions/artifacts/" + numeric(artifact_id) + "/zip"
        req = request.Request(url, headers={"Authorization": "Bearer " + self.token,
                                          "Accept": "application/vnd.github+json"})
        try:
            with self.http.opener.open(req, timeout=30) as response:
                require(response.geturl() == url, "Unexpected archive redirect")
                payload = response.read(1024 * 1024 + 1)
        except error.HTTPError as exc:
            require(exc.code == 302, "Artifact archive request failed; response omitted")
            location = exc.headers.get("Location", "")
            exc.close()
            parts = parse.urlsplit(location)
            require(parts.scheme == "https" and parts.hostname and not parts.username
                    and not parts.password and not parts.fragment, "Unsafe signed artifact URL")
            # The API's signed download URL must NEVER receive the GitHub token.
            _, payload = self.http._fetch(location)
        except (error.URLError, TimeoutError, OSError, ValueError):
            raise ReleaseError("Artifact download failed; transport details omitted") from None
        require(len(payload) <= 1024 * 1024, "Artifact archive exceeded size limit")
        return payload


def select_source(github, inputs):
    operation = inputs["operation"]
    run_id, attempt = inputs["source_run_id"], inputs["source_attempt"]
    workflow_path = PUBLISH_WORKFLOW if operation == "deploy" else DEPLOY_WORKFLOW
    prefix = "/repos/" + REPOSITORY
    workflow = github.get(prefix + "/actions/workflows/" + workflow_path.rsplit("/", 1)[-1])
    run = github.get(prefix + "/actions/runs/" + run_id + "/attempts/" + attempt)
    require(numeric(run.get("id")) == run_id and numeric(run.get("run_attempt")) == attempt,
            "Workflow run or attempt mismatch")
    require(run.get("workflow_id") == workflow.get("id") and run.get("path") == workflow_path,
            "Artifact did not come from the approved workflow")
    repository, head_repo = run.get("repository", {}), run.get("head_repository", {})
    require(repository.get("full_name") == REPOSITORY and head_repo.get("full_name") == REPOSITORY
            and repository.get("id") == head_repo.get("id") and not head_repo.get("fork"),
            "Fork or repository identity mismatch")
    require(run.get("head_branch") == "main" and COMMIT.fullmatch(run.get("head_sha", "")),
            "Only builds and receipts from main are trusted")
    require(run.get("status") == "completed", "Source run must be completed")
    if operation == "deploy":
        require(run.get("conclusion") == "success" and run.get("event") in {"push", "workflow_dispatch"},
                "Image source must be a successful main publication")
    else:
        require(run.get("event") == "workflow_dispatch", "Recovery source must be a manual deployment workflow")
    # A removed/force-pushed commit cannot authorize a new image or recovery.
    comparison = github.get(prefix + "/compare/" + run["head_sha"] + "..." + inputs["context"]["workflow_sha"])
    require(comparison.get("status") in {"ahead", "identical"},
            "Source workflow commit is not in the selected main deployment history")
    name = ("studio-gq-release-" + run["head_sha"] + "-" + attempt if operation == "deploy"
            else "studio-gq-staging-receipt-" + run_id + "-" + attempt)
    matches = []
    for page in range(1, 11):
        result = github.get(prefix + "/actions/runs/" + run_id + "/artifacts?per_page=100&page=" + str(page))
        rows = result.get("artifacts")
        require(isinstance(rows, list), "Unexpected artifact listing")
        matches.extend(row for row in rows if row.get("name") == name)
        if len(rows) < 100:
            break
    else:
        raise ReleaseError("Too many source artifacts; refusing incomplete provenance inspection")
    require(len(matches) == 1, "Expected exactly one unambiguous release or receipt artifact")
    artifact = matches[0]
    source = artifact.get("workflow_run", {})
    require(not artifact.get("expired") and 0 < artifact.get("size_in_bytes", 0) <= 1024 * 1024,
            "Artifact is expired, empty, or unexpectedly large")
    require(str(source.get("id")) == run_id and source.get("head_sha") == run["head_sha"]
            and source.get("head_branch") == "main"
            and source.get("repository_id") == repository.get("id")
            and source.get("head_repository_id") == repository.get("id"), "Artifact provenance mismatch")
    require(DIGEST.fullmatch(artifact.get("digest", "")), "Artifact lacks a SHA256 integrity digest")
    return dict(inputs, source_sha=run["head_sha"], artifact_id=numeric(artifact.get("id")),
                artifact_digest=artifact["digest"], artifact_name=name, source_workflow=workflow_path)


def read_artifact_json(directory, name):
    root = Path(directory).resolve()
    path = root / name
    require(path.is_file() and not path.is_symlink() and path.resolve().parent == root,
            "Missing or unsafe artifact JSON file")
    require(path.stat().st_size <= MAX_JSON, "Artifact JSON is unexpectedly large")
    payload = path.read_bytes()
    try:
        value = json.loads(payload)
    except (ValueError, UnicodeError):
        raise ReleaseError("Artifact did not contain valid JSON") from None
    require(isinstance(value, dict), "Artifact must contain JSON objects")
    return value, hashlib.sha256(payload).hexdigest()


def download_artifact(github, selection, directory):
    payload = github.archive(selection["artifact_id"])
    require("sha256:" + hashlib.sha256(payload).hexdigest() == selection["artifact_digest"],
            "Artifact archive digest does not match GitHub metadata")
    expected = {"release.json"} if selection["operation"] == "deploy" else {"receipt.json", "workflow.json"}
    try:
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            files = archive.infolist()
            require(len(files) == len(expected) and {item.filename for item in files} == expected,
                    "Artifact archive has unexpected or duplicate paths")
            require(all(not item.is_dir() and 0 < item.file_size <= MAX_JSON for item in files),
                    "Artifact JSON has an invalid size")
            root = Path(directory)
            root.mkdir(parents=True, exist_ok=True)
            for item in files:
                # Write only allowlisted basenames; never extract paths or symlinks.
                data = archive.read(item)
                require(len(data) <= MAX_JSON, "Artifact JSON exceeded size limit")
                with (root / item.filename).open("xb") as output:
                    output.write(data)
    except (zipfile.BadZipFile, RuntimeError):
        raise ReleaseError("Artifact archive is invalid") from None


def validate_artifact(selection, directory):
    base, cfg = config_for(CONFIG, SITE, REPOSITORY)
    operation = selection["operation"]
    approved = {"schema_version": 1, "site": SITE, "operation": operation,
                "configuration_sha256": identity_hash(cfg), "context": selection["context"],
                "source_run_id": selection["source_run_id"], "source_attempt": selection["source_attempt"],
                "source_sha": selection["source_sha"], "source_artifact_id": selection["artifact_id"],
                "source_artifact_digest": selection["artifact_digest"],
                "expected_current_tag": selection["expected_current_tag"],
                "deployment_uuid": selection["deployment_uuid"]}
    if operation == "deploy":
        manifest, _ = read_artifact_json(directory, "release.json")
        commit = selection["source_sha"]
        tag = "sha-" + commit + "-" + selection["source_run_id"] + "-" + selection["source_attempt"]
        digest = manifest.get("image_digest", "")
        require(manifest.get("schema_version") == 1 and manifest.get("source_repository") == REPOSITORY
                and manifest.get("source_commit") == commit and manifest.get("image_name") == IMAGE
                and manifest.get("image_tag") == tag and DIGEST.fullmatch(digest)
                and manifest.get("image_reference") == IMAGE + "@" + digest
                and str(manifest.get("run_attempt")) == selection["source_attempt"]
                and manifest.get("workflow_run") == "https://github.com/" + REPOSITORY + "/actions/runs/" + selection["source_run_id"],
                "Release manifest does not match the successful publication")
        approved["release"] = {"commit": commit, "tag": tag, "digest": digest}
    else:
        receipt, receipt_hash = read_artifact_json(directory, "receipt.json")
        provenance, _ = read_artifact_json(directory, "workflow.json")
        require(provenance.get("schema_version") == 1 and provenance.get("repository") == REPOSITORY
                and provenance.get("workflow_path") == DEPLOY_WORKFLOW
                and provenance.get("workflow_sha") == selection["source_sha"]
                and str(provenance.get("run_id")) == selection["source_run_id"]
                and str(provenance.get("attempt")) == selection["source_attempt"]
                and provenance.get("receipt_sha256") == receipt_hash
                and provenance.get("operation") in OPERATIONS, "Receipt provenance or integrity mismatch")
        ReleaseClient(Http(base, "unused"), cfg, SITE)._receipt_matches(receipt)
        approved["receipt"] = receipt
    return approved


def verify_request(path, expected_hash, env=os.environ):
    require(re.fullmatch(r"[0-9a-f]{64}", expected_hash or ""), "Missing approved request hash")
    payload = Path(path).read_bytes()
    require(len(payload) <= MAX_JSON and hashlib.sha256(payload).hexdigest() == expected_hash,
            "Approved request integrity mismatch")
    approved = json.loads(payload)
    ctx = context(env)
    require(approved.get("schema_version") == 1 and approved.get("site") == SITE,
            "Unknown approved request schema or site")
    require(approved.get("context", {}).get("repository") == REPOSITORY
            and approved["context"].get("workflow_sha") == ctx["workflow_sha"]
            and approved["context"].get("run_id") == ctx["run_id"], "Approved request belongs to a different workflow run")
    operation = approved.get("operation")
    require(operation in OPERATIONS, "Unknown approved operation")
    if operation != "resume":
        require(ctx["attempt"] == "1", "Mutation rerun blocked; use a new resume operation")
    _, cfg = config_for(CONFIG, SITE, REPOSITORY)
    require(approved.get("configuration_sha256") == identity_hash(cfg), "Approved site configuration changed")
    return approved, ctx


def execute_request(path, expected_hash, output_dir, env=os.environ, api_factory=Http):
    approved, ctx = verify_request(path, expected_hash, env)
    operation = approved["operation"]
    base, cfg = config_for(CONFIG, SITE, REPOSITORY)
    read_token, write_token = env.get("COOLIFY_READ_TOKEN"), env.get("COOLIFY_WRITE_TOKEN")
    require(read_token, "COOLIFY_READ_TOKEN is required")
    require(operation == "resume" or write_token, "COOLIFY_WRITE_TOKEN is required for a mutation")
    client = ReleaseClient(api_factory(base, read_token, write_token), cfg, SITE)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    target = output / "receipt.json"
    require(not target.exists(), "Local receipt already exists; refusing another operation")
    try:
        if operation == "deploy":
            release = approved["release"]
            return client.deploy(approved["expected_current_tag"], release["tag"], release["digest"], release["commit"], target)
        if operation == "resume":
            save_receipt(target, approved["receipt"], new=True)
            return client.resume(target, approved.get("deployment_uuid") or None)
        original = output / "source-receipt.json"
        save_receipt(original, approved["receipt"], new=True)
        return client.rollback(original, target)
    finally:
        # Always preserve an uncertain attempt. No credential or API log is saved.
        if target.is_file():
            provenance = dict(ctx, schema_version=1, operation=operation,
                              source_run_id=approved["source_run_id"],
                              source_attempt=approved["source_attempt"], request_sha256=expected_hash,
                              receipt_sha256=hashlib.sha256(target.read_bytes()).hexdigest())
            save_receipt(output / "workflow.json", provenance)


def outputs(values):
    output = os.environ.get("GITHUB_OUTPUT")
    require(output, "GITHUB_OUTPUT is missing")
    with open(output, "a", encoding="utf-8") as handle:
        for key, value in values.items():
            require(re.fullmatch(r"[a-z_]+", key) and re.fullmatch(r"[A-Za-z0-9_-]+", str(value)),
                    "Unsafe workflow output")
            handle.write(key + "=" + str(value) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["select", "validate", "verify-request", "execute"])
    parser.add_argument("--selection", default="selection.json")
    parser.add_argument("--artifact-dir")
    parser.add_argument("--request", default="approved/request.json")
    parser.add_argument("--output-dir", default="receipts")
    args = parser.parse_args()
    try:
        if args.command == "select":
            require(args.artifact_dir, "Artifact directory required")
            github = GitHub(os.environ.get("GH_TOKEN"))
            selection = select_source(github, parse_inputs())
            download_artifact(github, selection, args.artifact_dir)
            save_receipt(args.selection, selection, new=True)
            outputs({"artifact_id": selection["artifact_id"], "source_run_id": selection["source_run_id"]})
        elif args.command == "validate":
            require(args.artifact_dir, "Artifact directory required")
            approved = validate_artifact(load_json(args.selection), args.artifact_dir)
            save_receipt(args.request, approved, new=True)
            outputs({"request_sha": hashlib.sha256(Path(args.request).read_bytes()).hexdigest()})
        elif args.command == "verify-request":
            verify_request(args.request, os.environ.get("APPROVED_REQUEST_SHA"))
            require(os.environ.get("TS_OIDC_CLIENT_ID") and os.environ.get("TS_OIDC_AUDIENCE"),
                    "Tailscale OIDC identifiers have not been configured")
        else:
            result = execute_request(args.request, os.environ.get("APPROVED_REQUEST_SHA"), args.output_dir)
            print(json.dumps({"state": result["state"], "site": SITE, "deployment_uuid": result.get("deployment_uuid")}))
        return 0
    except ReleaseError as exc:
        print("Release stopped: " + str(exc), file=sys.stderr)
        return 1
    except (OSError, KeyError, ValueError, TypeError, AttributeError):
        print("Release stopped: invalid input or local I/O failure; inspect retained receipt", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
