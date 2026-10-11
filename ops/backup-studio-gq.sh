#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
exec 9>/run/lock/studio-gq-backup.lock
flock -n 9 || exit 1
source /etc/rooiko-backup/environment
export RESTIC_REPOSITORY="${RESTIC_REPOSITORY%/}/studio-gq"
unset RESTIC_PASSWORD
export RESTIC_PASSWORD_FILE=/etc/studio-gq-backup/password
stage=/var/lib/studio-gq-backup/staging
install -d -m 700 "$stage/data" "$stage/config"
python3 - <<'PY'
import sqlite3, pathlib, hashlib, json
source=pathlib.Path('/srv/studio-gq/production/data/studio-gq.db')
if not source.is_file(): raise SystemExit('Studio GQ database missing')
with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as src, sqlite3.connect('/var/lib/studio-gq-backup/staging/data/studio-gq.db') as dst:
    src.backup(dst)
    if dst.execute('pragma integrity_check').fetchall()!=[('ok',)] or dst.execute('pragma foreign_key_check').fetchall(): raise SystemExit('Snapshot integrity failed')
    tables=[r[0] for r in dst.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name")]
    manifest={table:{'count':dst.execute('select count(*) from "'+table+'"').fetchone()[0]} for table in tables}
    pathlib.Path('/var/lib/studio-gq-backup/staging/data/manifest.json').write_text(json.dumps(manifest))
PY
cp -a /srv/studio-gq/config/. "$stage/config/"
python3 - <<'PY'
import pathlib, hashlib, json
root=pathlib.Path('/var/lib/studio-gq-backup/staging')
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and p.name!='file-manifest.json'}
(root/'file-manifest.json').write_text(json.dumps(manifest))
PY
restic backup --host nimda --tag studio-gq "$stage"
restic forget --tag studio-gq --keep-daily 7 --keep-weekly 4 --keep-monthly 12
date -u +%FT%TZ > /var/lib/studio-gq-backup/last-success
echo STUDIO_GQ_BACKUP_SUCCESS
