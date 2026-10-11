import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

if (!process.argv[2]) throw new Error('Provide an isolated snapshot, not production data.');
mkdirSync('.migration', {recursive:true});
const target=resolve(`.migration/readonly-${randomUUID()}.db`);
copyFileSync(process.argv[2],target);
// An expired pending hold proves dashboard reads do not run cleanup while frozen.
const fixture=new DatabaseSync(target);
const groupId=randomUUID(), bookingId=randomUUID(), created='2020-01-01T00:00:00.000Z';
fixture.prepare('insert into studio_booking_groups (id,request_id,payload_hash,created_at) values (?,?,?,?)').run(groupId,randomUUID(),'isolated-readonly-fixture',created);
fixture.prepare("insert into studio_bookings (id,booking_group_id,booking_date,session,name,email,phone,message,price_zar,status,hold_expires_at,created_at,updated_at) values (?,?,'2040-03-11','morning','Read-only Test','test@example.com','+27845150956','',2500,'pending',?,?,?)").run(bookingId,groupId,created,created,created);
fixture.prepare("insert into studio_booking_slots (booking_id,booking_date,slot,created_at) values (?,'2040-03-11','morning',?)").run(bookingId,created);
fixture.close();
const tables=['studio_booking_groups','studio_bookings','studio_booking_slots','studio_calendar_blocks'];
function fingerprint() {
  const db=new DatabaseSync(target);
  try { return createHash('sha256').update(JSON.stringify(tables.map(t=>db.prepare(`select * from "${t}" order by id`).all()))).digest('hex'); }
  finally { db.close(); }
}
const before=fingerprint();
const port=3043, origin=`http://localhost:${port}`;
const password='isolated-readonly-test-password';
const secret='isolated-readonly-session-secret-at-least-32-characters';
// Simulate an already-signed-in crew member, without allowing sign-in mutations.
const payload=Buffer.from(JSON.stringify({email:'test@example.com',expiresAt:Math.floor(Date.now()/1000)+600})).toString('base64url');
const cookie=`studio_gq_crew_session=${payload}.${createHmac('sha256',secret).update(payload).digest('base64url')}`;
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{
  env:{...process.env,STUDIO_DATABASE_PATH:target,TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',APP_ORIGIN:origin,
    MIGRATION_READ_ONLY:'1',EMAIL_DELIVERY_DISABLED:'1',RESEND_API_KEY:'',FORJDECK_INTEGRATION_SECRET:'',FORJDECK_ALLOWED_ORGANIZATION_ID:'',
    CREW_PORTAL_EMAIL:'test@example.com',CREW_PORTAL_PASSWORD:password,CREW_SESSION_SECRET:secret},
  stdio:['ignore','pipe','pipe'],
});
let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
async function request(path,method='GET',body,cookie='') {
  return fetch(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},
    ...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'manual'});
}
try {
  for(let i=0;i<60;i++){try{if((await request('/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
  for(const path of ['/','/booking','/api/health','/api/availability?month=2040-03']) assert.equal((await request(path)).status,200,path);
  assert.equal((await request('/crew','GET',undefined,cookie)).status,200,'Read-only crew dashboard remains accessible');
  for(const [path,method] of [['/api/bookings','POST'],['/api/enquiries','POST'],['/api/crew/calendar-blocks','POST'],
    ['/api/crew/bookings/synthetic-id','POST'],['/api/crew/bookings/synthetic-id','PATCH'],['/api/integrations/forjdeck/bookings/synthetic-id/confirm','POST'],
    ['/api/crew/session','POST'],['/api/crew/session','DELETE']]) {
    const response=await request(path,method,{},cookie);
    assert.equal(response.status,503,path+' maintenance status');
    assert.equal(response.headers.get('retry-after'),'120');
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.match((await response.json()).message,/briefly paused/);
  }
  assert.equal(fingerprint(),before,'All four booking tables stay unchanged');
  console.log('PASS: read-only marketing/calendar/dashboard with expired hold, all eight mutation paths paused, four-table fingerprint unchanged; emails disabled.');
}catch(e){console.error(logs.slice(-2000));throw e;}finally{child.kill();}
