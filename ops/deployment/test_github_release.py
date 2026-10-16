import copy
import hashlib
import io
import json
from pathlib import Path
import shutil
import unittest
from unittest import mock
from urllib import error
import uuid
import zipfile

import github_release as release
from coolify_release import ReleaseError, config_for, identity_hash, save_receipt


SHA = "b" * 40
ENV = {"GITHUB_REPOSITORY": release.REPOSITORY, "GITHUB_REF": "refs/heads/main",
       "GITHUB_WORKFLOW_REF": release.REPOSITORY + "/" + release.DEPLOY_WORKFLOW + "@refs/heads/main",
       "GITHUB_SHA": SHA, "GITHUB_RUN_ID": "100", "GITHUB_RUN_ATTEMPT": "1",
       "RELEASE_OPERATION": "deploy", "SOURCE_RUN_ID": "50", "SOURCE_RUN_ATTEMPT": "1",
       "EXPECTED_CURRENT_TAG": "sha-" + "a" * 40}


class TestDirectory:
    def __init__(self):
        self.root = Path(__file__).resolve().parent
        self.path = self.root / (".test-" + uuid.uuid4().hex)
        self.path.mkdir(mode=0o777)

    def __enter__(self):
        return self.path

    def __exit__(self, *_):
        assert self.path.resolve().parent == self.root
        shutil.rmtree(self.path)


class FakeGitHub:
    def __init__(self, operation="deploy"):
        workflow = release.PUBLISH_WORKFLOW if operation == "deploy" else release.DEPLOY_WORKFLOW
        self.run = {"id": 50, "run_attempt": 1, "workflow_id": 7, "path": workflow,
                    "repository": {"full_name": release.REPOSITORY, "id": 9},
                    "head_repository": {"full_name": release.REPOSITORY, "id": 9, "fork": False},
                    "head_branch": "main", "head_sha": SHA, "status": "completed",
                    "conclusion": "success", "event": "workflow_dispatch"}
        name = "studio-gq-release-" + SHA + "-1" if operation == "deploy" else "studio-gq-staging-receipt-50-1"
        self.artifact = {"id": 12, "name": name, "expired": False, "size_in_bytes": 100,
                         "digest": "sha256:" + "f" * 64,
                         "workflow_run": {"id": 50, "head_sha": SHA, "head_branch": "main",
                                           "repository_id": 9, "head_repository_id": 9}}
        self.comparison = "identical"

    def get(self, path):
        if "/actions/workflows/" in path:
            return {"id": 7}
        if "/attempts/" in path:
            return copy.deepcopy(self.run)
        if "/compare/" in path:
            return {"status": self.comparison}
        if "/artifacts?" in path:
            return {"artifacts": [copy.deepcopy(self.artifact)]}
        raise AssertionError(path)


class ProvenanceTests(unittest.TestCase):
    def test_real_transport_allows_commit_comparison_but_blocks_path_traversal(self):
        client = release.GitHub("synthetic-token")
        client.http._fetch = mock.Mock(return_value=(200, b'{"status":"identical"}'))
        prefix = "/repos/" + release.REPOSITORY
        self.assertEqual(client.get(prefix + "/compare/" + SHA + "..." + SHA)["status"], "identical")
        for path in [prefix + "/../outside", prefix + "/actions/../../outside", prefix + "/actions/%2e%2e/outside",
                     "https://evil.example/", prefix + "/actions?token=x", prefix + "/actions#fragment"]:
            with self.subTest(path=path), self.assertRaises(ReleaseError):
                client.get(path)
        self.assertEqual(client.http._fetch.call_count, 1)

    def test_successful_main_publication_selects_exact_artifact(self):
        selected = release.select_source(FakeGitHub(), release.parse_inputs(ENV))
        self.assertEqual(selected["artifact_id"], "12")
        self.assertEqual(selected["source_run_id"], "50")

    def test_untrusted_run_fails_closed(self):
        for field, value in [("head_branch", "feature"), ("path", "other.yml"), ("workflow_id", 8),
                             ("status", "in_progress"), ("conclusion", "failure"), ("event", "pull_request"),
                             ("head_sha", "shell$(attack)")]:
            github = FakeGitHub()
            github.run[field] = value
            with self.subTest(field=field), self.assertRaises(ReleaseError):
                release.select_source(github, release.parse_inputs(ENV))

    def test_fork_or_artifact_substitution_is_rejected(self):
        github = FakeGitHub()
        github.run["head_repository"]["id"] = 10
        with self.assertRaises(ReleaseError):
            release.select_source(github, release.parse_inputs(ENV))
        github = FakeGitHub()
        github.artifact["workflow_run"]["head_sha"] = "c" * 40
        with self.assertRaises(ReleaseError):
            release.select_source(github, release.parse_inputs(ENV))

    def test_expired_or_missing_digest_artifact_is_rejected(self):
        for key, value in [("expired", True), ("digest", None), ("name", "other-artifact")]:
            github = FakeGitHub()
            github.artifact[key] = value
            with self.subTest(key=key), self.assertRaises((ReleaseError, TypeError)):
                release.select_source(github, release.parse_inputs(ENV))

    def test_removed_main_history_is_rejected(self):
        github = FakeGitHub()
        github.comparison = "diverged"
        with self.assertRaises(ReleaseError):
            release.select_source(github, release.parse_inputs(ENV))

    def test_mutation_reruns_and_injected_inputs_rejected(self):
        for key, value in [("GITHUB_RUN_ATTEMPT", "2"), ("SOURCE_RUN_ID", "1;evil"),
                           ("EXPECTED_CURRENT_TAG", "latest"), ("GITHUB_REF", "refs/heads/feature")]:
            env = dict(ENV, **{key: value})
            with self.subTest(key=key), self.assertRaises(ReleaseError):
                release.parse_inputs(env)

    def test_failed_deployment_run_is_valid_for_readonly_recovery(self):
        env = dict(ENV, RELEASE_OPERATION="resume", EXPECTED_CURRENT_TAG="", GITHUB_RUN_ATTEMPT="2")
        github = FakeGitHub("resume")
        github.run["conclusion"] = "failure"
        self.assertEqual(release.select_source(github, release.parse_inputs(env))["operation"], "resume")

    def manifest(self):
        digest = "sha256:" + "d" * 64
        return {"schema_version": 1, "source_repository": release.REPOSITORY, "source_commit": SHA,
                "image_name": release.IMAGE, "image_tag": "sha-" + SHA + "-50-1", "image_digest": digest,
                "image_reference": release.IMAGE + "@" + digest, "run_attempt": "1",
                "workflow_run": "https://github.com/" + release.REPOSITORY + "/actions/runs/50"}

    def test_manifest_must_match_exact_run_image_digest_and_attempt(self):
        selection = release.select_source(FakeGitHub(), release.parse_inputs(ENV))
        with TestDirectory() as directory:
            save_receipt(directory / "release.json", self.manifest())
            approved = release.validate_artifact(selection, directory)
            self.assertEqual(approved["release"]["commit"], SHA)
            for field, value in [("source_commit", "a" * 40), ("image_name", "ghcr.io/attacker/image"),
                                 ("image_tag", "latest"), ("run_attempt", "2"), ("image_digest", "sha256:bad")]:
                manifest = self.manifest()
                manifest[field] = value
                save_receipt(directory / "release.json", manifest)
                with self.subTest(field=field), self.assertRaises(ReleaseError):
                    release.validate_artifact(selection, directory)

    def test_approved_request_cannot_be_swapped_or_replayed_as_mutation(self):
        selection = release.select_source(FakeGitHub(), release.parse_inputs(ENV))
        with TestDirectory() as directory:
            save_receipt(directory / "release.json", self.manifest())
            approved = release.validate_artifact(selection, directory)
            path = directory / "request.json"
            save_receipt(path, approved)
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            self.assertEqual(release.verify_request(path, digest, ENV)[0]["operation"], "deploy")
            with self.assertRaises(ReleaseError):
                release.verify_request(path, digest, dict(ENV, GITHUB_RUN_ATTEMPT="2"))
            with self.assertRaises(ReleaseError):
                release.verify_request(path, digest, dict(ENV, GITHUB_RUN_ID="101"))
            approved["release"]["tag"] = "latest"
            save_receipt(path, approved)
            with self.assertRaises(ReleaseError):
                release.verify_request(path, digest, ENV)

    def test_receipt_requires_matching_workflow_provenance_and_hash(self):
        env = dict(ENV, RELEASE_OPERATION="rollback", EXPECTED_CURRENT_TAG="")
        selection = release.select_source(FakeGitHub("rollback"), release.parse_inputs(env))
        base, cfg = config_for(release.CONFIG, release.SITE, release.REPOSITORY)
        receipt = {"schema_version": 1, "site": release.SITE, "api_url": base,
                   "application_uuid": cfg["application_uuid"], "repository": release.REPOSITORY,
                   "image": release.IMAGE, "configuration_sha256": identity_hash(cfg),
                   "prior_tag": "sha-" + "a" * 40, "prior_commit": "a" * 40,
                   "target_tag": "sha-" + SHA, "target_commit": SHA}
        with TestDirectory() as directory:
            save_receipt(directory / "receipt.json", receipt)
            provenance = dict(release.context(ENV), schema_version=1, run_id="50", attempt="1", operation="deploy",
                              receipt_sha256=hashlib.sha256((directory / "receipt.json").read_bytes()).hexdigest())
            save_receipt(directory / "workflow.json", provenance)
            self.assertEqual(release.validate_artifact(selection, directory)["receipt"], receipt)
            provenance["workflow_sha"] = "c" * 40
            save_receipt(directory / "workflow.json", provenance)
            with self.assertRaises(ReleaseError):
                release.validate_artifact(selection, directory)

    def test_archive_hash_and_allowlisted_paths_are_enforced(self):
        def zipped(name):
            data = io.BytesIO()
            with zipfile.ZipFile(data, "w") as archive:
                archive.writestr(name, json.dumps(self.manifest()))
            return data.getvalue()
        for name in ["release.json", "../release.json"]:
            payload = zipped(name)
            selection = {"operation": "deploy", "artifact_id": "12",
                         "artifact_digest": "sha256:" + hashlib.sha256(payload).hexdigest()}
            github = mock.Mock()
            github.archive.return_value = payload
            with TestDirectory() as directory:
                if name == "release.json":
                    release.download_artifact(github, selection, directory)
                    self.assertTrue((directory / name).exists())
                else:
                    with self.assertRaises(ReleaseError):
                        release.download_artifact(github, selection, directory)
            selection["artifact_digest"] = "sha256:" + "a" * 64
            with TestDirectory() as directory, self.assertRaises(ReleaseError):
                release.download_artifact(github, selection, directory)

    def test_github_token_is_not_forwarded_to_signed_archive_url(self):
        github = release.GitHub("test-only-token")
        github.http.opener = mock.Mock()
        github.http.opener.open.side_effect = error.HTTPError("https://api.github.com", 302, "Found",
            {"Location": "https://example.blob.core.windows.net/archive?sig=signed"}, io.BytesIO())
        github.http._fetch = mock.Mock(return_value=(200, b"zip"))
        self.assertEqual(github.archive("12"), b"zip")
        self.assertEqual(github.http._fetch.call_args.args, ("https://example.blob.core.windows.net/archive?sig=signed",))


if __name__ == "__main__":
    unittest.main()
