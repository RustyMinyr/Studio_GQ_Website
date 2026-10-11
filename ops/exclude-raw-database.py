#!/usr/bin/env python3
import pathlib,shutil
path=pathlib.Path('/usr/local/sbin/backup-nimda')
text=path.read_text();needle='  --exclude /srv/dasu \\\n'
if '--exclude /srv/studio-gq' not in text:
    if text.count(needle)!=1:raise SystemExit('Backup contract changed; refusing patch')
    shutil.copyfile(path,'/home/codex-admin/studio-gq-migration/backup-nimda.before-studio-gq')
    path.write_text(text.replace(needle,needle+'  --exclude /srv/studio-gq \\\n'))
print('STUDIO_GQ_RAW_DATABASE_EXCLUDED_FROM_SHARED_BACKUP')
