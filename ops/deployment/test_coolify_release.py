import contextlib
import copy
import io
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
import uuid
from unittest import mock
from urllib import error, request

from coolify_release import (COMMIT, Http, NoRedirect, ReleaseClient, ReleaseError,
                                  TransportError, config_for, identity_hash, load_json,
                                  main, receipt_lock, save_receipt, utc_now, valid_url)


OLD = "a" * 40
NEW = "b" * 40
DIGEST = "sha256:" + "c" * 64
OLD_TAG = "sha-" + OLD
NEW_TAG = "sha256-" + "c" * 64
CFG = {"application_uuid": "app123", "repository": "example/site",
       "image": "ghcr.io/example/site",
       "expected_fields": {"name": "Example production", "build_pack": "dockerimage", "git_repository": None, "destination_id": 2},
       "expected_server_id": 0,
       "image_reference_mode": "digest",
       "verification": {"health_url": "https://example.com/health",
                        "version_url": "https://example.com/version", "json_key": "commit"}}


class TestDirectory:
    """Normal inherited ACLs also work in the Windows app-container sandbox."""
    def __init__(self):
        self.root = Path(__file__).resolve().parent
        self.path = self.root / (".test-" + uuid.uuid4().hex)
        self.path.mkdir(mode=0o777)
        self.name = str(self.path)

    def cleanup(self):
        if self.path.exists():
            assert self.path.resolve().parent == self.root
            shutil.rmtree(self.path)

    def __enter__(self):
        return self.name

    def __exit__(self, *_):
        self.cleanup()


class FakeClock:
    def __init__(self):
        self.value = 0

    def now(self):
        return self.value

    def sleep(self, seconds):
        self.value += seconds


class FakeApi:
    base_url = "https://coolify.example/api/v1"

    def __init__(self):
        self.calls = []
        self.application = {"id": 9, "uuid": "app123", "name": "Example production",
                            "build_pack": "dockerimage", "git_repository": None,
                            "destination_id": 2, "destination": {"server_id": 0},
                            "docker_registry_image_name": CFG["image"],
                            "docker_registry_image_tag": OLD_TAG, "status": "running:healthy",
                            "settings": {"is_auto_deploy_enabled": False}}
        self.active = []
        self.history = [{"application_id": "9", "server_id": 0, "destination_id": "2"}]
        self.deployments = {}
        self.current_commit = OLD
        self.next_status = "finished"
        self.fail_method = None
        self.health_ok = True
        self.stale_version = False
        self.bad_response = False
        self.poll_errors = []
        self.null_deployment_tag = False

    def api(self, method, path, body=None, timeout=None):
        self.calls.append((method, path, copy.deepcopy(body)))
        if self.fail_method == method:
            raise TransportError()
        if method == "GET" and path == "/applications/app123":
            return copy.deepcopy(self.application)
        if method == "GET" and path == "/deployments":
            return copy.deepcopy(self.active)
        if method == "GET" and path == "/deployments/applications/app123":
            return {"count": len(self.history), "deployments": copy.deepcopy(self.history)}
        if method == "PATCH":
            self.application.update(body)
            return {"uuid": "app123"}
        if method == "POST":
            identifier = "deploy" + str(len(self.deployments) + 1)
            target = self.application["docker_registry_image_tag"]
            self.deployments[identifier] = {"deployment_uuid": identifier, "application_id": "9",
                                            "server_id": 0, "destination_id": "2",
                                            "docker_registry_image_tag": None if self.null_deployment_tag else target, "pull_request_id": 0,
                                            "status": self.next_status, "created_at": utc_now()}
            if not self.stale_version:
                self.current_commit = OLD if target == OLD_TAG else NEW
            if self.bad_response:
                return {"deployments": [{"resource_uuid": "other", "deployment_uuid": identifier}]}
            return {"deployments": [{"resource_uuid": "app123", "deployment_uuid": identifier}]}
        if method == "GET" and path.startswith("/deployments/"):
            if self.poll_errors:
                raise self.poll_errors.pop(0)
            return copy.deepcopy(self.deployments[path.rsplit("/", 1)[-1]])
        raise AssertionError((method, path))

    def public(self, url, timeout=None):
        self.calls.append(("PUBLIC", url, None))
        if not self.health_ok:
            raise TransportError(503)
        return 200, json.dumps({"commit": self.current_commit}).encode()


class ClientTests(unittest.TestCase):
    def setUp(self):
        self.temporary = TestDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.receipt = Path(self.temporary.name) / "receipt.json"
        self.api = FakeApi()
        self.clock = FakeClock()
        self.client = ReleaseClient(self.api, copy.deepcopy(CFG), "example", timeout=3,
                                    interval=1, clock=self.clock.now, sleep=self.clock.sleep)

    def deploy(self):
        return self.client.deploy(OLD_TAG, "sha-" + NEW, DIGEST, NEW, self.receipt)

    def mutations(self):
        return [call for call in self.api.calls if call[0] in {"PATCH", "POST"}]

    def test_success_pins_digest_captures_prior_and_verifies_version(self):
        result = self.deploy()
        self.assertEqual(result["state"], "verified")
        self.assertEqual(result["prior_tag"], OLD_TAG)
        self.assertEqual(result["prior_commit"], OLD)
        self.assertEqual(result["target_tag"], NEW_TAG)
        self.assertEqual(self.mutations(), [("PATCH", "/applications/app123", {"docker_registry_image_tag": NEW_TAG}),
                                           ("POST", "/deploy", {"uuid": "app123", "force": False})])
        self.assertEqual(load_json(self.receipt)["state"], "verified")
        self.assertNotIn("logs", load_json(self.receipt))

    def test_missing_application_numeric_id_resolves_from_uuid_scoped_history(self):
        del self.api.application["id"]
        result = self.deploy()
        self.assertEqual(result["application_id"], "9")
        self.assertEqual(result["server_id"], "0")

    def test_normal_coolify_null_tag_verifies_with_explicit_proof_strength(self):
        self.api.null_deployment_tag = True
        result = self.deploy()
        self.assertEqual(result["state"], "verified")
        self.assertEqual(result["configured_image_reference"], CFG["image"] + "@" + DIGEST)
        self.assertFalse(result["runtime_digest_inspected"])
        self.assertEqual(result["verification_method"], "finished_deployment_configured_image_and_live_commit")
        self.assertNotIn("docker_tag", self.mutations()[1][2])
        self.assertEqual(self.client.resume(self.receipt)["state"], "verified")
        self.assertEqual(len(self.mutations()), 2)

    def test_null_tag_rejects_old_missing_or_invalid_request_time(self):
        self.api.null_deployment_tag = True
        self.deploy()
        row = self.api.deployments["deploy1"]
        for value in ["2020-01-01T00:00:00Z", "invalid", None, "2100-01-01T00:00:00Z"]:
            row["created_at"] = value
            with self.assertRaises(ReleaseError):
                self.client.resume(self.receipt)
        self.assertEqual(len(self.mutations()), 2)

    def test_null_tag_still_requires_unchanged_config_and_live_commit(self):
        self.api.null_deployment_tag = True
        self.deploy()
        self.api.application["docker_registry_image_tag"] = OLD_TAG
        with self.assertRaisesRegex(ReleaseError, "tag changed"):
            self.client.resume(self.receipt)
        self.api.application["docker_registry_image_tag"] = NEW_TAG
        self.api.current_commit = OLD
        with self.assertRaisesRegex(ReleaseError, "timed out"):
            self.client.resume(self.receipt)
        self.assertEqual(len(self.mutations()), 2)

    def test_finished_release_requires_healthy_application(self):
        self.api.application["status"] = "running:unhealthy"
        with self.assertRaisesRegex(ReleaseError, "timed out"):
            self.deploy()
        self.assertEqual(load_json(self.receipt)["state"], "timed_out")

    def test_empty_or_mixed_scoped_history_and_wrong_server_fail_closed(self):
        for rows in [[], [{"application_id": "10", "server_id": 0, "destination_id": "2"}],
                     [{"application_id": "9", "server_id": 1, "destination_id": "2"}],
                     [{"application_id": "9", "server_id": 0, "destination_id": "3"}]]:
            self.api.history = rows
            with self.assertRaises(ReleaseError):
                self.deploy()
            self.assertFalse(self.mutations())

    def test_application_destination_server_must_match_allowlist(self):
        self.api.application["destination"]["server_id"] = 1
        with self.assertRaises(ReleaseError):
            self.deploy()
        self.assertFalse(self.mutations())

    def test_commit_tag_mode_retains_commit_tag_and_records_digest(self):
        self.client.cfg["image_reference_mode"] = "commit-tag"
        result = self.deploy()
        self.assertEqual(result["target_tag"], "sha-" + NEW)
        self.assertEqual(result["candidate_digest"], DIGEST)

    def test_unique_run_attempt_tag_preserves_candidate_commit(self):
        self.client.cfg["image_reference_mode"] = "commit-tag"
        tag = "sha-" + NEW + "-123-2"
        result = self.client.deploy(OLD_TAG, tag, DIGEST, NEW, self.receipt)
        self.assertEqual(result["target_tag"], tag)

    def test_identity_and_current_tag_mismatches_never_mutate(self):
        for field, value in [("uuid", "other"), ("name", "Another app"), ("build_pack", "dockerfile"),
                             ("git_repository", "unexpected"), ("docker_registry_image_name", "ghcr.io/other/image"),
                             ("docker_registry_image_tag", "sha-" + "d" * 40)]:
            with self.subTest(field=field):
                previous = self.api.application[field]
                self.api.application[field] = value
                with self.assertRaises(ReleaseError):
                    self.deploy()
                self.assertFalse(self.mutations())
                self.api.application[field] = previous

    def test_active_and_unknown_deployments_block_but_other_apps_do_not(self):
        for status in ["queued", "in_progress", "unknown"]:
            self.api.active = [{"application_id": 9, "status": status}]
            with self.assertRaises(ReleaseError):
                self.deploy()
            self.assertFalse(self.mutations())
        self.api.active = [{"application_id": 10, "status": "in_progress"}]
        self.assertEqual(self.deploy()["state"], "verified")

    def test_missing_deployment_identity_fails_closed(self):
        self.api.active = [{"status": "queued"}]
        with self.assertRaises(ReleaseError):
            self.deploy()
        self.assertFalse(self.mutations())

    def test_auto_deploy_must_be_disabled(self):
        self.api.application["settings"]["is_auto_deploy_enabled"] = True
        with self.assertRaises(ReleaseError):
            self.deploy()
        self.assertFalse(self.mutations())

    def test_prior_tag_must_match_live_commit(self):
        self.api.current_commit = NEW
        with self.assertRaisesRegex(ReleaseError, "live commit disagree"):
            self.deploy()
        self.assertFalse(self.mutations())

    def test_immutable_previous_and_candidate_identities_required(self):
        for previous, tag, digest, commit in [("latest", "sha-" + NEW, DIGEST, NEW),
                                             (OLD_TAG, "latest", DIGEST, NEW),
                                             (OLD_TAG, "sha-" + OLD, DIGEST, NEW),
                                             (OLD_TAG, "sha-" + NEW, "sha256:bad", NEW)]:
            with self.subTest(tag=tag, digest=digest):
                with self.assertRaises(ReleaseError):
                    self.client.deploy(previous, tag, digest, commit, self.receipt)
                self.assertFalse(self.mutations())

    def test_existing_receipt_prevents_repeat_trigger(self):
        self.deploy()
        prior = len(self.mutations())
        with self.assertRaisesRegex(ReleaseError, "resume"):
            self.deploy()
        self.assertEqual(len(self.mutations()), prior)

    def test_patch_network_failure_is_durable_and_never_retried(self):
        self.api.fail_method = "PATCH"
        with self.assertRaises(TransportError):
            self.deploy()
        self.assertEqual(load_json(self.receipt)["state"], "patch_requested")
        self.assertEqual(len(self.mutations()), 1)
        self.api.fail_method = None
        with self.assertRaisesRegex(ReleaseError, "No known deployment UUID"):
            self.client.resume(self.receipt)
        self.assertEqual(len(self.mutations()), 1)

    def test_post_network_failure_never_retries_on_resume(self):
        self.api.fail_method = "POST"
        with self.assertRaises(TransportError):
            self.deploy()
        self.assertEqual(load_json(self.receipt)["state"], "trigger_requested")
        self.api.fail_method = None
        with self.assertRaisesRegex(ReleaseError, "No known deployment UUID"):
            self.client.resume(self.receipt)
        self.assertEqual(len(self.mutations()), 2)

    def test_unexpected_post_response_keeps_uncertainty_receipt(self):
        self.api.bad_response = True
        with self.assertRaisesRegex(ReleaseError, "ambiguous"):
            self.deploy()
        self.assertEqual(load_json(self.receipt)["state"], "trigger_requested")
        self.assertEqual(len(self.mutations()), 2)

    def test_timeout_resume_only_polls_existing_deployment(self):
        self.api.next_status = "in_progress"
        with self.assertRaisesRegex(ReleaseError, "timed out"):
            self.deploy()
        self.assertEqual(load_json(self.receipt)["state"], "timed_out")
        self.api.deployments["deploy1"]["status"] = "finished"
        self.assertEqual(self.client.resume(self.receipt)["state"], "verified")
        self.assertEqual(len(self.mutations()), 2)

    def test_finished_job_with_old_version_is_not_success(self):
        self.api.stale_version = True
        with self.assertRaisesRegex(ReleaseError, "timed out"):
            self.deploy()
        self.assertEqual(load_json(self.receipt)["state"], "timed_out")

    def test_poll_transient_get_error_recovers_without_retrigger(self):
        self.api.poll_errors = [TransportError(503), TransportError(429)]
        self.assertEqual(self.deploy()["state"], "verified")
        self.assertEqual(len(self.mutations()), 2)

    def test_poll_auth_error_fails_without_retry(self):
        self.api.poll_errors = [TransportError(401)]
        with self.assertRaises(TransportError):
            self.deploy()
        self.assertEqual(self.clock.value, 0)
        self.assertEqual(load_json(self.receipt)["state"], "deploying")

    def test_failed_deployment_does_not_automatically_roll_back(self):
        self.api.next_status = "failed"
        with self.assertRaisesRegex(ReleaseError, "failed or was cancelled"):
            self.deploy()
        self.assertEqual(load_json(self.receipt)["state"], "deployment_failed")
        self.assertEqual(self.api.application["docker_registry_image_tag"], NEW_TAG)
        self.assertEqual(len(self.mutations()), 2)

    def test_resume_rejects_wrong_deployment_application_image_or_preview(self):
        self.deploy()
        row = self.api.deployments["deploy1"]
        for field, value in [("application_id", "10"), ("server_id", 1), ("destination_id", 3),
                             ("docker_registry_image_tag", OLD_TAG), ("pull_request_id", 1)]:
            old = row[field]
            row[field] = value
            with self.assertRaises(ReleaseError):
                self.client.resume(self.receipt)
            row[field] = old
        self.assertEqual(len(self.mutations()), 2)

    def test_receipt_cannot_target_different_configuration(self):
        self.deploy()
        self.client.cfg["verification"]["version_url"] = "https://other.com/version"
        with self.assertRaisesRegex(ReleaseError, "Receipt identity"):
            self.client.resume(self.receipt)
        self.assertEqual(len(self.mutations()), 2)

    def test_explicit_rollback_restores_recorded_tag_and_commit(self):
        self.deploy()
        rollback_path = self.receipt.with_name("rollback.json")
        result = self.client.rollback(self.receipt, rollback_path)
        self.assertEqual(result["state"], "verified")
        self.assertEqual(result["target_tag"], OLD_TAG)
        self.assertEqual(result["target_commit"], OLD)
        self.assertEqual(result["rollback_of"], load_json(self.receipt)["release_id"])
        self.assertEqual(len(self.mutations()), 4)
        self.assertEqual(load_json(self.receipt)["target_tag"], NEW_TAG)

    def test_rollback_rejects_newer_release_or_in_progress_original(self):
        self.deploy()
        self.api.application["docker_registry_image_tag"] = "sha-" + "d" * 40
        with self.assertRaises(ReleaseError):
            self.client.rollback(self.receipt, self.receipt.with_name("rollback.json"))
        self.api.application["docker_registry_image_tag"] = NEW_TAG
        self.api.deployments["deploy1"]["status"] = "in_progress"
        with self.assertRaises(ReleaseError):
            self.client.rollback(self.receipt, self.receipt.with_name("rollback.json"))
        self.assertEqual(len(self.mutations()), 2)

    def test_adopt_uncertain_trigger_requires_matching_creation_time(self):
        self.api.bad_response = True
        with self.assertRaises(ReleaseError):
            self.deploy()
        self.api.deployments["deploy1"]["created_at"] = "2020-01-01T00:00:00Z"
        with self.assertRaisesRegex(ReleaseError, "time does not match"):
            self.client.resume(self.receipt, "deploy1")
        row = load_json(self.receipt)
        self.api.deployments["deploy1"]["created_at"] = row["trigger_requested_at"]
        self.assertEqual(self.client.resume(self.receipt, "deploy1")["state"], "verified")
        self.assertEqual(len(self.mutations()), 2)


class ConfigurationAndTransportTests(unittest.TestCase):
    def test_config_enforces_repo_and_site_allowlists(self):
        with TestDirectory() as directory:
            path = Path(directory) / "sites.json"
            save_receipt(path, {"schema_version": 1, "coolify_api_url": FakeApi.base_url, "sites": {"example": CFG}})
            self.assertEqual(config_for(path, "example", "example/site")[1], CFG)
            for site, repo in [("missing", "example/site"), ("example", "attacker/site")]:
                with self.assertRaises(ReleaseError):
                    config_for(path, site, repo)

    def test_urls_require_tls_or_explicit_private_http_and_no_credentials(self):
        for url in ["http://public.example/api/v1", "https://user:pass@host/api/v1", "https://host/api/v1?token=x", "https://host/api/v1#token"]:
            with self.assertRaises(ReleaseError):
                valid_url(url)
        with self.assertRaises(ReleaseError):
            valid_url("http://8.8.8.8/api/v1", True)
        self.assertEqual(valid_url("http://100.64.1.2:8000/api/v1", True), "http://100.64.1.2:8000/api/v1")

    def test_api_paths_cannot_escape_trusted_origin(self):
        client = Http(FakeApi.base_url, "read-secret", "write-secret")
        client._fetch = mock.Mock()
        for path in ["https://evil.example", "//evil.example", "/../evil", "/applications/x?url=evil"]:
            with self.assertRaises(ReleaseError):
                client.api("GET", path)
        client._fetch.assert_not_called()

    def test_read_and_write_tokens_separate_and_public_requests_have_no_token(self):
        client = Http(FakeApi.base_url, "read-secret", "write-secret")
        client._fetch = mock.Mock(return_value=(200, b"{}"))
        client.api("GET", "/applications/app123")
        client.api("PATCH", "/applications/app123", {"docker_registry_image_tag": NEW_TAG})
        client.public("https://example.com/health")
        calls = client._fetch.call_args_list
        self.assertEqual(calls[0].args[2], "read-secret")
        self.assertEqual(calls[1].args[2], "write-secret")
        self.assertEqual(calls[2].args, ("https://example.com/health",))

    def test_redirect_is_rejected_and_error_body_is_not_exposed(self):
        redirect = NoRedirect()
        self.assertIsNone(redirect.redirect_request(request.Request(FakeApi.base_url), None, 302, "Found", {}, "https://evil.example"))
        client = Http(FakeApi.base_url, "read-secret")
        client.opener = mock.Mock()
        client.opener.open.side_effect = error.HTTPError("https://secret", 302, "read-secret", {}, io.BytesIO(b"read-secret"))
        with self.assertRaises(TransportError) as caught:
            client.api("GET", "/deployments")
        self.assertNotIn("read-secret", str(caught.exception))
        self.assertNotIn("secret", str(caught.exception))
        client.opener.open.assert_called_once()

    def test_receipt_lock_prevents_concurrent_recovery(self):
        with TestDirectory() as directory:
            path = Path(directory) / "receipt.json"
            with receipt_lock(path):
                with self.assertRaisesRegex(ReleaseError, "locked"):
                    with receipt_lock(path):
                        pass
            self.assertFalse(Path(str(path) + ".lock").exists())

    def test_missing_credentials_cli_error_does_not_echo_environment(self):
        with TestDirectory() as directory:
            path = Path(directory) / "sites.json"
            save_receipt(path, {"schema_version": 1, "coolify_api_url": FakeApi.base_url, "sites": {"example": CFG}})
            output = io.StringIO()
            with mock.patch.dict(os.environ, {"OTHER_SECRET": "never-display-this"}, clear=True), contextlib.redirect_stderr(output):
                code = main(["preflight", "--config", str(path), "--site", "example", "--repository", "example/site"])
            self.assertEqual(code, 1)
            self.assertNotIn("never-display-this", output.getvalue())


if __name__ == "__main__":
    unittest.main()
