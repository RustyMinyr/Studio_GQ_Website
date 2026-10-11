#!/usr/bin/env python3
"""Install the approved final frozen snapshot, retaining the old stopped DB."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import sys

CONTAINER = 'lhosiqfbxr4x6uqbwtjvetka'
ROOT = Path('/srv/studio-gq/production/data')
SOURCE = Path('/home/codex-admin/studio-gq-migration/final-frozen-20261011.db')
DEST = ROOT / 'studio-gq.db'
ARCHIVE = Path('/srv/studio-gq/config/pre-final-copy-20261011')

def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout.strip()

expected = sys.argv[1] if len(sys.argv) == 2 else ''
if len(expected) != 64 or any(c not in '0123456789abcdef' for c in expected):
    raise SystemExit('Expected snapshot hash is required')
if SOURCE.resolve() != SOURCE or ROOT.resolve() != ROOT or DEST.is_symlink():
    raise SystemExit('Unexpected snapshot/data path')
if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != expected:
    raise SystemExit('Final snapshot transfer hash mismatch')
db = sqlite3.connect(f'file:{SOURCE}?mode=ro', uri=True)
if db.execute('pragma integrity_check').fetchall() != [('ok',)] or db.execute('pragma foreign_key_check').fetchall():
    raise SystemExit('Invalid final snapshot')
counts = {t: db.execute(f'select count(*) from {t}').fetchone()[0] for t in ['studio_booking_groups', 'studio_bookings', 'studio_booking_slots', 'studio_calendar_blocks']}
if db.execute("select count(*) from sqlite_master where type='trigger' and name like 'sgq_migration_freeze_%'").fetchone()[0]:
    raise SystemExit('Destination must not inherit source freeze triggers')
db.close()
info = json.loads(run('docker', 'inspect', CONTAINER))[0]
if info['Config']['Image'].split(':')[0] != CONTAINER or not any(m.get('Source') == str(ROOT) and m.get('Destination') == '/app/data' for m in info['Mounts']):
    raise SystemExit('Unexpected target container or mount')
if ARCHIVE.exists():
    raise SystemExit('Prior snapshot archive already exists; refusing repeat install')
run('docker', 'stop', CONTAINER)
if run('docker', 'inspect', '--format', '{{.State.Running}}', CONTAINER) != 'false':
    raise SystemExit('Writer is still running')
ARCHIVE.mkdir(mode=0o700)
for suffix in ['', '-wal', '-shm']:
    old = Path(str(DEST) + suffix)
    if old.exists():
        if old.resolve().parent != ROOT or old.is_symlink():
            raise SystemExit('Unexpected database sidecar path')
        shutil.move(str(old), str(ARCHIVE / old.name))
temp = ROOT / 'studio-gq.db.final-copy'
if temp.exists():
    raise SystemExit('Unexpected staging file')
shutil.copyfile(SOURCE, temp)
os.chown(temp, 1000, 1000)
os.chmod(temp, 0o600)
os.replace(temp, DEST)
if hashlib.sha256(DEST.read_bytes()).hexdigest() != expected:
    raise SystemExit('Installed snapshot hash mismatch')
print(json.dumps({'installed': True, 'sha256': expected, 'tables': counts, 'writer': 'stopped', 'previousCopyRetained': True}))
