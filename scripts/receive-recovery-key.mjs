import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const r=spawnSync('C:\\Program Files\\Tailscale\\tailscale.exe',['ssh','codex-admin@nimda','base64 -w0 /home/codex-admin/studio-gq-migration/backup-password.enc'],{encoding:'utf8'});
if(r.status!==0 || !/^[A-Za-z0-9+/=]+$/.test(r.stdout)) throw new Error('Encrypted recovery key transfer failed');
const encrypted=Buffer.from(r.stdout,'base64');
if(encrypted.length!==512) throw new Error('Unexpected RSA encrypted key size');
mkdirSync('.migration',{recursive:true});writeFileSync('.migration/backup-password.enc',encrypted);
console.log('Encrypted recovery key copied off server (512 bytes); no plaintext secret output.');
