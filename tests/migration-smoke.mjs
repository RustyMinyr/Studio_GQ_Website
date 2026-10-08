import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const source=process.argv[2];
if(!source) throw new Error('Provide a database snapshot; never run against the production file.');
mkdirSync('.migration',{recursive:true});
const target=resolve(`.migration/test-${randomUUID()}.db`);
copyFileSync(source,target);
const port=3041, origin=`http://localhost:${port}`;
const password='synthetic-test-password-strong';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{
  env:{...process.env,STUDIO_DATABASE_PATH:target,APP_ORIGIN:origin,EMAIL_DELIVERY_DISABLED:'1',RESEND_API_KEY:'',FORJDECK_INTEGRATION_SECRET:'',FORJDECK_ALLOWED_ORGANIZATION_ID:'',CREW_PORTAL_EMAIL:'test@example.com',CREW_PORTAL_PASSWORD:password,CREW_SESSION_SECRET:'synthetic-session-secret-at-least-32-characters'},
  stdio:['ignore','pipe','pipe'],
});
let logs=''; child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
async function request(path,body,cookie='',headers={}) {
  return fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'manual'});
}
try {
  for(let i=0;i<60;i++){try{if((await request('/api/health')).ok)break;}catch{} await new Promise(r=>setTimeout(r,250));}
  assert.equal((await request('/api/health')).status,200);
  for(const path of ['/','/booking','/services','/resources','/privacy','/terms','/sitemap.xml','/robots.txt']) assert.equal((await request(path)).status,200,path);
  assert.equal((await request('/api/crew/session',{password},{},{Origin:'https://attacker.example'})).status,403);
  assert.equal((await request('/api/crew/session',{password:'wrong'})).status,401);
  const login=await request('/api/crew/session',{password});assert.equal(login.status,200);
  const setCookie=login.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/Secure/i);assert.match(setCookie,/SameSite=strict/i);
  const cookie=setCookie.split(';')[0];
  assert.equal((await request('/crew',undefined,cookie)).status,200);
  const dates=['2040-03-11','2040-03-12'];
  const booking={requestId:randomUUID(),dates,session:'morning',name:'Migration Test',company:'Controlled test',email:'migration@example.com',phone:'+27845150956',additionalItems:[],message:''};
  const saved=await request('/api/bookings',booking);assert.equal(saved.status,201,await saved.text());
  const db=new DatabaseSync(target);
  const row=db.prepare('select id from studio_bookings where email=? and booking_date=?').get(booking.email,dates[0]);
  assert.equal(db.prepare('select count(*) as n from studio_bookings where email=?').get(booking.email).n,2);
  assert.equal((await request('/api/bookings',booking)).status,201,'Idempotent retry');
  assert.equal((await request('/api/bookings',{...booking,requestId:randomUUID(),session:'full_day'})).status,409,'Prevent full-day overlap');
  const competing=await Promise.all([1,2].map(()=>request('/api/bookings',{...booking,requestId:randomUUID(),dates:['2040-03-20']})));
  assert.deepEqual(competing.map(r=>r.status).sort(),[201,409],'Concurrent booking race reserves only once');
  assert.equal((await request(`/api/crew/bookings/${row.id}`,{action:'confirm'})).status,401,'Unauthenticated admin denied');
  assert.equal((await request(`/api/crew/bookings/${row.id}`,{action:'confirm',quote:{filename:'bad.pdf',content:Buffer.from('not a PDF').toString('base64')}},cookie)).status,400,'Reject fake PDF');
  assert.equal((await request(`/api/crew/bookings/${row.id}`,{action:'confirm',note:'Controlled migration check'},cookie)).status,200);
  assert.equal(db.prepare('select status from studio_bookings where id=?').get(row.id).status,'confirmed');
  assert.equal((await request(`/api/crew/bookings/${row.id}`,{action:'reschedule',date:'2040-03-13',session:'afternoon'},cookie)).status,200);
  assert.equal((await request(`/api/crew/bookings/${row.id}`,{action:'cancel'},cookie)).status,200);
  assert.equal(db.prepare('select count(*) as n from studio_booking_slots where booking_id=?').get(row.id).n,0);
  assert.equal((await request('/api/crew/calendar-blocks',{date:'2040-03-14',session:'full_day',reason:'Test block'},cookie)).status,201);
  assert.equal(db.prepare('pragma integrity_check').get().integrity_check,'ok');
  assert.deepEqual(db.prepare('pragma foreign_key_check').all(),[]);db.close();
  assert.equal((await request('/api/integrations/forjdeck/bookings?year=2040')).status,503,'Disabled unconfigured integration');
  let limited=false;
  for(let i=0;i<10;i++) {const r=await request('/api/crew/session',{password:'wrong'},'',{'cf-connecting-ip':`192.0.2.${i}`}); if(r.status===429){limited=true;break;}}
  assert.ok(limited,'Login limiter cannot be bypassed with spoofed CF headers');
  console.log('PASS: routes, preserved login, cookies, CSRF, optional production text, multi-day write, retry, conflict, permissions, PDF validation, confirm/reschedule/cancel, calendar block, integrity and persistent login limits. Emails disabled.');
} catch(e){console.error(logs.slice(-2000));throw e;}finally{child.kill();}
