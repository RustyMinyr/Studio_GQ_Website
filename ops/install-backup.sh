#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
src=/home/codex-admin/studio-gq-migration
install -d -m 700 /etc/studio-gq-backup /srv/studio-gq/config /var/lib/studio-gq-backup
if [[ ! -s /etc/studio-gq-backup/password ]]; then openssl rand -hex 48 > /etc/studio-gq-backup/password; fi
install -m 600 "$src/runtime.json" /srv/studio-gq/config/runtime.json
install -m 600 "$src/precopy.evidence.json" /srv/studio-gq/config/precopy.evidence.json
install -m 755 "$src/backup.sh" /usr/local/sbin/backup-studio-gq
install -m 644 "$src/backup.service" /etc/systemd/system/studio-gq-backup.service
install -m 644 "$src/backup.timer" /etc/systemd/system/studio-gq-backup.timer
install -m 755 "$src/notify.sh" /usr/local/sbin/notify-studio-gq
install -m 644 "$src/notify.service" /etc/systemd/system/studio-gq-notify.service
source /etc/rooiko-backup/environment
export RESTIC_REPOSITORY="${RESTIC_REPOSITORY%/}/studio-gq"
unset RESTIC_PASSWORD
export RESTIC_PASSWORD_FILE=/etc/studio-gq-backup/password
if ! restic cat config >/dev/null 2>&1; then restic init; fi
systemctl daemon-reload
systemctl enable --now studio-gq-backup.timer
systemctl start --no-block studio-gq-backup.service
echo STUDIO_GQ_BACKUP_INSTALLED
