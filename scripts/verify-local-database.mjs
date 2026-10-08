import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const db = new DatabaseSync(process.argv[2],{readOnly:true});
try {
  const expected = JSON.parse(readFileSync(process.argv[3],'utf8'));
  for (const [table,entry] of Object.entries(expected)) {
    if (!/^studio_[a-z_]+$/.test(table)) throw new Error('Invalid table');
    const rows = db.prepare(`select * from "${table}"`).all();
    const canonical = rows.map(r=>Object.fromEntries(Object.keys(r).sort().map(k=>[k,r[k]]))).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const sha = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
    if (rows.length !== entry.count || sha !== entry.sourceSha256) throw new Error(`Mismatch: ${table}`);
  }
  if (db.prepare('pragma integrity_check').get().integrity_check !== 'ok' || db.prepare('pragma foreign_key_check').all().length) throw new Error('Integrity failed');
  console.log('All table counts, digests, integrity and relationships match.');
} finally {db.close();}
