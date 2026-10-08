#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
source /etc/rooiko-backup/environment
export RESTIC_REPOSITORY="${RESTIC_REPOSITORY%/}/studio-gq"
unset RESTIC_PASSWORD
export RESTIC_PASSWORD_FILE=/etc/studio-gq-backup/password
target="/var/lib/studio-gq-backup/restore-$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$target"
restic check --read-data
restic restore latest --tag studio-gq --target "$target"
python3 - "$target" <<'PY'
import sys, pathlib, sqlite3, hashlib, json
root=pathlib.Path(sys.argv[1])/'var/lib/studio-gq-backup/staging'
db=sqlite3.connect((root/'data/studio-gq.db').as_uri()+'?mode=ro',uri=True)
if db.execute('pragma integrity_check').fetchall()!=[('ok',)] or db.execute('pragma foreign_key_check').fetchall(): raise SystemExit('Restore integrity failed')
expected=json.loads((root/'data/manifest.json').read_text())
for table,item in expected.items():
    if db.execute('select count(*) from "'+table+'"').fetchone()[0]!=item['count']: raise SystemExit('Restore count mismatch')
for relative,digest in json.loads((root/'file-manifest.json').read_text()).items():
    restored=(root/relative).resolve()
    if not restored.is_relative_to(root.resolve()) or not restored.is_file() or hashlib.sha256(restored.read_bytes()).hexdigest()!=digest: raise SystemExit('Restore file hash mismatch')
print('RESTORE_DATA_AND_FILE_HASHES_MATCH')
PY
echo "STUDIO_GQ_RESTORE_VERIFIED $target"
