import { createClient } from '@tursodatabase/serverless/compat';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const tables = ['studio_booking_groups','studio_bookings','studio_calendar_blocks','studio_booking_slots'];
const client = createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
const mode = process.argv[2];
const digest = rows => createHash('sha256').update(JSON.stringify(rows.map(r=>Object.fromEntries(Object.keys(r).sort().map(k=>[k,r[k]]))).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))))).digest('hex');
try {
  if (mode === 'freeze' || mode === 'thaw') {
    const tx = await client.transaction('write');
    try {
      for (const table of tables) for (const operation of ['insert','update','delete']) {
        const name = `sgq_migration_freeze_${table}_${operation}`;
        await tx.execute(mode === 'freeze'
          ? `create trigger if not exists "${name}" before ${operation} on "${table}" begin select raise(abort, 'Studio GQ migration write freeze'); end`
          : `drop trigger if exists "${name}"`);
      }
      await tx.commit();
      console.log(`Studio GQ table write freeze: ${mode === 'freeze' ? 'enabled' : 'removed'}`);
    } catch(e) {await tx.rollback(); throw e;}
  } else if (mode === 'export') {
    const output = resolve(process.argv[3] || '.migration/source.db');
    if (!output.startsWith(resolve('.migration') + (process.platform === 'win32' ? '\\' : '/'))) throw new Error('Export must stay in ignored .migration directory');
    if (existsSync(output)) throw new Error('Refusing to overwrite an existing migration snapshot');
    mkdirSync(dirname(output),{recursive:true,mode:0o700});
    const tx = await client.transaction('read');
    const db = new DatabaseSync(output);
    const evidence = {};
    try {
      db.exec('pragma foreign_keys=off; begin immediate');
      const schema = await tx.execute("select type,name,tbl_name,sql from sqlite_master where sql is not null order by case type when 'table' then 0 when 'index' then 1 else 2 end, name");
      for (const row of schema.rows) {
        if (row.type === 'table' && tables.includes(row.name)) db.exec(row.sql);
      }
      for (const table of tables) {
        const result = await tx.execute(`select * from "${table}"`);
        const rows = result.rows.map(row=>Object.fromEntries(result.columns.map(c=>[c,row[c]])));
        const columns = db.prepare(`pragma table_info("${table}")`).all().map(r=>r.name);
        const insert = db.prepare(`insert into "${table}" (${columns.map(c=>`"${c}"`).join(',')}) values (${columns.map(()=>'?').join(',')})`);
        for (const row of rows) insert.run(...columns.map(c=>row[c]));
        const target = db.prepare(`select * from "${table}"`).all();
        evidence[table] = {count:rows.length,sourceSha256:digest(rows),targetSha256:digest(target)};
        if (evidence[table].sourceSha256 !== evidence[table].targetSha256) throw new Error(`Digest mismatch: ${table}`);
      }
      for (const row of schema.rows) if (row.type !== 'table' && tables.includes(row.tbl_name) && !row.name.startsWith('sgq_migration_freeze_')) db.exec(row.sql);
      db.exec('commit; pragma foreign_keys=on');
      if (db.prepare('pragma integrity_check').get().integrity_check !== 'ok') throw new Error('Integrity check failed');
      if (db.prepare('pragma foreign_key_check').all().length) throw new Error('Foreign key check failed');
      await tx.commit();
      writeFileSync(output + '.evidence.json',JSON.stringify(evidence,null,2),{mode:0o600});
      console.log(JSON.stringify({snapshot:output,tables:evidence,integrity:'ok',foreignKeys:'ok'},null,2));
    } finally {if (!tx.closed) await tx.rollback(); db.close();}
  } else throw new Error('Usage: export <.migration/path.db> | freeze | thaw');
} finally {client.close();}
