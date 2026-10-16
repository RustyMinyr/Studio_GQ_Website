#!/usr/bin/env bash
# Fixed Studio GQ staging snapshot only. Run from the existing authorized root terminal.
# Uses the existing encrypted off-host repository; never prunes or touches live data.
set -euo pipefail
umask 077
test "$(id -u)" = 0
id=p20261016190255-8349a070
src=/srv/studio-gq/staging/data/backups
test "$(readlink -f "$src")" = "$src"
for ext in db json; do
  test -f "$src/$id.$ext"
  test ! -L "$src/$id.$ext"
done
command -v restic >/dev/null
command -v python3 >/dev/null
test -f /etc/rooiko-backup/environment
test ! -L /etc/rooiko-backup/environment
# Existing root-owned backup configuration; no credentials are printed.
set -a
. /etc/rooiko-backup/environment
set +a
case "${RESTIC_REPOSITORY:-}" in
  s3:*|b2:*|rest:https://*|sftp:*) ;;
  *) echo 'Refusing an unverified or local repository.' >&2; exit 1 ;;
esac
base=/var/lib/rooiko-backup
test -d "$base"
test "$(readlink -f "$base")" = "$base"
proof=$(mktemp -d "$base/pilot-restore-$id-XXXXXXXX")
# Preflight compares the immutable snapshot to the original manifest before upload.
python3 - "$src/$id.db" "$src/$id.json" <<'PY'
import sys,json,hashlib,pathlib
p=pathlib.Path(sys.argv[1]); m=json.loads(pathlib.Path(sys.argv[2]).read_text())
assert m['application_uuid']=='i6niok9h83f4nijpfjw3o8xh'
assert m['backup_id']=='p20261016190255-8349a070'
assert m['source_commit']=='8fa929e87d092d1ff3fe74e2c6d6271b64db5a5a'
assert m['integrity']=='ok' and m['restore_test']=='passed' and m['foreign_key_errors']==0
assert p.stat().st_size==m['snapshot_bytes']
assert hashlib.sha256(p.read_bytes()).hexdigest()==m['snapshot_sha256']
PY
restic backup --json --tag studio-pilot-verified --tag "$id" "$src/$id.db" "$src/$id.json" > "$proof/backup.jsonl" 2> "$proof/backup.stderr"
snapshot=$(python3 - "$proof/backup.jsonl" <<'PY'
import sys,json,re
rows=[json.loads(line) for line in open(sys.argv[1]) if line.strip()]
summaries=[r for r in rows if r.get('message_type')=='summary']
assert len(summaries)==1
s=summaries[0]['snapshot_id']; assert re.fullmatch('[a-f0-9]{8,64}',s)
print(s)
PY
)
restic snapshots --json "$snapshot" > "$proof/snapshot.json" 2> "$proof/snapshot.stderr"
snapshot=$(python3 - "$proof/snapshot.json" "$src" "$id" <<'PY'
import sys,json,re
r=json.load(open(sys.argv[1])); assert len(r)==1
s=r[0]; assert re.fullmatch('[a-f0-9]{64}',s['id'])
assert sorted(s['paths'])==sorted([sys.argv[2]+'/'+sys.argv[3]+'.db',sys.argv[2]+'/'+sys.argv[3]+'.json'])
print(s['id'])
PY
)
mkdir "$proof/restored"
restic restore "$snapshot" --target "$proof/restored" > "$proof/restore.stdout" 2> "$proof/restore.stderr"
python3 - "$proof" "$src" "$id" "$snapshot" <<'PY'
import sys,json,pathlib,hashlib,sqlite3,datetime
proof,src,bid,snapshot=sys.argv[1:]
original=pathlib.Path(src)/(bid+'.db'); manifest=pathlib.Path(src)/(bid+'.json')
restored=pathlib.Path(proof)/'restored'/src.lstrip('/')/(bid+'.db')
restored_manifest=restored.with_suffix('.json')
assert restored.is_file() and not restored.is_symlink()
assert manifest.read_bytes()==restored_manifest.read_bytes()
m=json.loads(restored_manifest.read_text())
digest=hashlib.sha256(restored.read_bytes()).hexdigest()
assert digest==m['snapshot_sha256']==hashlib.sha256(original.read_bytes()).hexdigest()
assert restored.stat().st_size==m['snapshot_bytes']
db=sqlite3.connect(restored.as_uri()+'?mode=ro',uri=True)
assert db.execute('PRAGMA integrity_check').fetchall()==[('ok',)]
assert db.execute('PRAGMA foreign_key_check').fetchall()==[]
db.row_factory=sqlite3.Row
schema=[dict(r) for r in db.execute("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name")]
schema_hash=hashlib.sha256(json.dumps(schema,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
assert schema_hash==m['schema_sha256']
counts={r['name']:db.execute('SELECT count(*) FROM "'+r['name'].replace('"','""')+'"').fetchone()[0] for r in schema if r['type']=='table'}
assert counts==m['table_counts']; db.close()
receipt={'schema_version':1,'action':'ResticBackup','state':'verified','application_uuid':m['application_uuid'],'backup_id':bid,'source_commit':m['source_commit'],'snapshot_sha256':digest,'schema_sha256':schema_hash,'table_counts':counts,'snapshot_bytes':m['snapshot_bytes'],'off_host':True,'encrypted':True,'restore_verified':True,'integrity':'ok','foreign_key_errors':0,'restic_snapshot_id':snapshot,'restore_directory':proof+'/restored','verified_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
destination=pathlib.Path(proof)/'receipt.json'
with destination.open('x') as f: json.dump(receipt,f,indent=2)
print(json.dumps(receipt,separators=(',',':')))
PY
