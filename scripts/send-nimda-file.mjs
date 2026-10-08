import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const remote = process.argv[3];
if (!/^\/home\/codex-admin\/studio-gq-migration\/[a-zA-Z0-9._-]+$/.test(remote)) throw new Error('Invalid destination');
const content=readFileSync(process.argv[2]).toString('base64');
const result=spawnSync('C:\\Program Files\\Tailscale\\tailscale.exe',['ssh','codex-admin@nimda',`umask 077; mkdir -p /home/codex-admin/studio-gq-migration; base64 -d > ${remote}`],{input:content,encoding:'utf8'});
if(result.status!==0) throw new Error('Private file transfer failed');
console.log('Private file transferred.');
