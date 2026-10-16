// One-shot private staging snapshot. Run only after verifying this file's SHA256.
// Usage: node pilot-backup.mjs backup <unique-id> <expected-running-commit>
//        node pilot-backup.mjs export <unique-id> <private-listener-origin> <capability>
import assert from 'node:assert/strict';
import { DatabaseSync, backup } from 'node:sqlite';
import fs from 'node:fs';
import { createHash, createPublicKey, randomBytes, createCipheriv, publicEncrypt, constants } from 'node:crypto';

const [mode, id, argument, capability] = process.argv.slice(2);
assert.ok(mode === 'backup' || mode === 'export', 'Unknown mode');
assert.match(id ?? '', /^p[0-9]{14}-[a-f0-9]{8}$/);
const root = '/app/data';
const source = root + '/studio-gq.db';
const directory = root + '/backups';
assert.equal(process.env.STUDIO_DATABASE_PATH, source, 'Unexpected database path');
assert.equal(fs.realpathSync(root).replaceAll('\\', '/'), root, 'Data mount must not be a symlink');
assert.equal(fs.realpathSync(source).replaceAll('\\', '/'), source, 'Database must not be a symlink');
assert.ok(fs.statSync(source).isFile());
fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
assert.equal(fs.realpathSync(directory).replaceAll('\\', '/'), directory, 'Backup directory must not be a symlink');
fs.chmodSync(directory, 0o700);
const snapshot = `${directory}/${id}.db`;
const restored = `${directory}/${id}.restore-test.db`;
const manifest = `${directory}/${id}.json`;
const applicationUuid = 'i6niok9h83f4nijpfjw3o8xh';

if (mode === 'export') {
  assert.match(capability ?? '', /^[A-Za-z0-9_-]{24,64}$/);
  const origin = new URL(argument);
  const octets = origin.hostname.split('.').map(Number);
  assert.ok(origin.protocol === 'http:' && octets.length === 4 && octets.every(n => Number.isInteger(n) && n >= 0 && n <= 255) && octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127, 'Receiver must be a literal private Tailscale address');
  assert.ok(!origin.username && !origin.password && !origin.search && !origin.hash && origin.pathname === '/', 'Receiver must be an origin only');
  assert.equal(fs.realpathSync(snapshot).replaceAll('\\', '/'), snapshot);
  assert.equal(fs.realpathSync(manifest).replaceAll('\\', '/'), manifest);
  const record = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  assert.equal(record.application_uuid, applicationUuid);
  assert.equal(record.backup_id, id);
  assert.equal(record.snapshot_path, snapshot);
  assert.equal(record.integrity, 'ok');
  assert.equal(record.restore_test, 'passed');
  assert.equal(record.foreign_key_errors, 0);
  assert.ok(fs.statSync(snapshot).size > 0 && fs.statSync(snapshot).size <= 64 * 1024 * 1024, 'Snapshot exceeds bounded transfer size');
  const database = fs.readFileSync(snapshot);
  assert.equal(createHash('sha256').update(database).digest('hex'), record.snapshot_sha256, 'Snapshot changed after verification');
  const headers = { Authorization: `Bearer ${capability}` };
  const keyResponse = await fetch(new URL('/public-key', origin), { headers, redirect: 'error', signal: AbortSignal.timeout(30000) });
  assert.equal(keyResponse.status, 200, 'Receiver public key unavailable');
  const keyDocument = await keyResponse.json();
  const publicKey = createPublicKey(keyDocument.public_key_pem);
  assert.equal(publicKey.asymmetricKeyType, 'rsa');
  assert.ok(publicKey.asymmetricKeyDetails.modulusLength >= 3072);
  const keyId = createHash('sha256').update(keyDocument.public_key_pem, 'utf8').digest('hex');
  assert.equal(keyDocument.key_id, keyId, 'Receiver key fingerprint differs');
  const aesKey = randomBytes(32), nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', aesKey, nonce);
  cipher.setAAD(Buffer.from(`${applicationUuid}:${id}:1`, 'utf8'));
  const plaintext = Buffer.from(JSON.stringify({ manifest: record, snapshot_base64: database.toString('base64') }), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const wrapped = publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, aesKey);
  aesKey.fill(0); plaintext.fill(0); database.fill(0);
  const envelope = { schema_version: 1, application_uuid: applicationUuid, backup_id: id, key_id: keyId, algorithm: 'RSA-OAEP-SHA256+AES-256-GCM', wrapped_key: wrapped.toString('base64'), nonce: nonce.toString('base64'), auth_tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64'), ciphertext_sha256: createHash('sha256').update(ciphertext).digest('hex') };
  const result = await fetch(new URL('/backup', origin), { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(envelope), redirect: 'error', signal: AbortSignal.timeout(60000) });
  assert.ok(result.status === 200 || result.status === 201, 'Receiver rejected encrypted backup');
  const receipt = await result.json();
  assert.equal(receipt.accepted, true);
  assert.equal(receipt.backup_id, id);
  assert.equal(receipt.snapshot_sha256, record.snapshot_sha256);
  assert.equal(receipt.restore_verified, true, 'Receiver must decrypt and independently verify SQLite before accepting');
  console.log('STUDIO_PILOT_EXPORT_VERIFIED ' + JSON.stringify({ backup_id: id, snapshot_sha256: record.snapshot_sha256, receiver_key_id: keyId }));
  process.exit(0);
}

const commit = argument;
assert.match(commit ?? '', /^[a-f0-9]{40}$/);
assert.equal(process.env.SOURCE_COMMIT, commit, 'Running source commit differs');
for (const path of [snapshot, restored, manifest]) assert.ok(!fs.existsSync(path), 'Backup name already exists');
process.umask(0o077);

const src = new DatabaseSync(source, { readOnly: true, timeout: 10000 });
try { src.prepare('VACUUM INTO ?').run(snapshot); } finally { src.close(); }
fs.chmodSync(snapshot, 0o600);

function inspect(db) {
  assert.deepEqual(db.prepare('PRAGMA integrity_check').all().map(x => x.integrity_check), ['ok']);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  const schema = db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();
  const tables = schema.filter(x => x.type === 'table').map(x => x.name);
  const counts = Object.fromEntries(tables.map(name => [name, db.prepare('SELECT count(*) AS n FROM "' + name.replaceAll('"', '""') + '"').get().n]));
  return { schema, counts };
}

const snap = new DatabaseSync(snapshot, { readOnly: true, timeout: 10000 });
let original;
try { original = inspect(snap); await backup(snap, restored); } finally { snap.close(); }
fs.chmodSync(restored, 0o600);
const verification = new DatabaseSync(restored, { readOnly: true, timeout: 10000 });
try { assert.deepEqual(inspect(verification), original, 'Restored schema or row counts differ'); } finally { verification.close(); }
const hash = createHash('sha256');
for await (const chunk of fs.createReadStream(snapshot)) hash.update(chunk);
const record = {
  schema_version: 1,
  application_uuid: applicationUuid,
  backup_id: id,
  source_commit: commit,
  created_at: new Date().toISOString(),
  database_path: source,
  snapshot_path: snapshot,
  snapshot_bytes: fs.statSync(snapshot).size,
  snapshot_sha256: hash.digest('hex'),
  schema_sha256: createHash('sha256').update(JSON.stringify(original.schema)).digest('hex'),
  table_counts: original.counts,
  integrity: 'ok',
  foreign_key_errors: 0,
  restore_test: 'passed',
  scope: 'local staging SQLite snapshot; not encrypted and not off-host'
};
fs.writeFileSync(manifest, JSON.stringify(record, null, 2), { flag: 'wx', mode: 0o600 });
// Remove only this invocation's verified temporary restore; retain the snapshot.
fs.unlinkSync(restored);
console.log('STUDIO_PILOT_BACKUP_OK ' + JSON.stringify(record));
