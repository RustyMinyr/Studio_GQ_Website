import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

assert.equal(process.env.MIGRATION_READ_ONLY, '1');
assert.equal(process.env.EMAIL_DELIVERY_DISABLED, '1');
assert.equal(process.env.STUDIO_DATABASE_PATH, '/app/data/studio-gq.db');
assert.ok(!process.env.TURSO_AUTH_TOKEN && !process.env.TURSO_DATABASE_URL);
const expected = {
  studio_booking_groups: [9, 'df19b7159b0b8482f2b2562947283922268ee4ffbd6193b5f75f474aaf48073d'],
  studio_bookings: [10, '8bb596bfda4255ef7817b637f1373420d716ada0efe466305ef191322f0d100f'],
  studio_booking_slots: [3, '24fd77095f9a00abe39ce93f6ac095c2e65f744bb39d115c4dafcec281e83f31'],
  studio_calendar_blocks: [0, '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945'],
};
const db = new DatabaseSync(process.env.STUDIO_DATABASE_PATH, { readOnly: true });
for (const [table, [count, hash]] of Object.entries(expected)) {
  const rows = db.prepare(`select * from ${table}`).all();
  const sorted = rows.map(r=>Object.fromEntries(Object.keys(r).sort().map(k=>[k,r[k]]))).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  assert.equal(rows.length, count);
  assert.equal(createHash('sha256').update(JSON.stringify(sorted)).digest('hex'), hash, table);
}
assert.equal(db.prepare('pragma integrity_check').get().integrity_check, 'ok');
assert.deepEqual(db.prepare('pragma foreign_key_check').all(), []);
db.close();
const health = await (await fetch('http://127.0.0.1:3000/api/health')).json();
assert.equal(health.commit, process.env.SOURCE_COMMIT);
const expectedCommit = process.argv[2];
assert.match(expectedCommit || '', /^[0-9a-f]{40}$/);
assert.equal(health.commit, expectedCommit);
assert.equal((await fetch('http://127.0.0.1:3000/api/bookings', {method:'POST',body:'{}',headers:{'Content-Type':'application/json'}})).status, 503);
console.log(JSON.stringify({commit:health.commit, finalRecordDigests:'all four match', integrity:'ok', foreignKeys:'ok', maintenance:'verified', tursoAbsent:true}));
