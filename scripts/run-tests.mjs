import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const database=`.migration/test-source-${randomUUID()}.db`;
for(const args of [['node_modules/next/dist/bin/next','build'],['scripts/init-local-database.mjs',database],['tests/migration-smoke.mjs',database]]) {
  const result=spawnSync(process.execPath,args,{stdio:'inherit'});
  if(result.status!==0) process.exit(result.status??1);
}
