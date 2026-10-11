import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const path=resolve(process.argv[2]);
if(existsSync(path)) throw new Error('Refusing to initialise an existing database');
mkdirSync(dirname(path),{recursive:true,mode:0o700});
const db=new DatabaseSync(path);
try {db.exec(readFileSync('turso/migrations/202607200001_create_studio_booking_system.sql','utf8'));}finally{db.close();}
console.log('Empty SQLite schema created.');
