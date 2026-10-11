import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const origin = 'https://www.studiogq.co.za';
assert.equal(process.env.APP_ORIGIN, origin);
assert.equal(process.env.MIGRATION_READ_ONLY, '0');
assert.equal(process.env.EMAIL_DELIVERY_DISABLED, '0');
assert.equal(process.env.BOOKING_NOTIFICATION_EMAIL, 'bookings@studiogq.co.za');
const request = (path, body, cookie='', headers={}) => fetch(origin+path, {
  method:body===undefined?'GET':'POST', redirect:'manual',
  headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...headers},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),
});
const readDb = fn => { const db=new DatabaseSync(process.env.STUDIO_DATABASE_PATH,{readOnly:true}); try{return fn(db)}finally{db.close()} };
const health=await (await request('/api/health')).json();
assert.equal(health.commit,process.env.SOURCE_COMMIT,'Public requests must reach this exact release');
if (process.argv[2]==='persistence') {
  const rows=readDb(db=>db.prepare('select id,status from studio_bookings where name=?').all('MIGRATION PUBLIC QA - NOT A REAL BOOKING'));
  assert.equal(rows.length,2);
  readDb(db=>{for(const row of rows){assert.equal(row.status,'cancelled');assert.equal(db.prepare('select count(*) n from studio_booking_slots where booking_id=?').get(row.id).n,0)}assert.ok(db.prepare('select count(*) n from studio_security_limits').get().n>0);assert.equal(db.prepare('pragma integrity_check').get().integrity_check,'ok');assert.deepEqual(db.prepare('pragma foreign_key_check').all(),[])});
  console.log(JSON.stringify({commit:health.commit,persistedAfterRestart:true,controlledRows:2,testSlotsReleased:true,loginLimitsPersisted:true,integrity:'ok'}));
  process.exit(0);
}
assert.equal(readDb(db=>db.prepare('select count(*) n from studio_bookings where name=?').get('MIGRATION PUBLIC QA - NOT A REAL BOOKING').n),0,'Do not repeat the public launch test');
assert.equal((await request('/api/crew/session',{password:'not-a-password'},'',{Origin:'https://attacker.example'})).status,403);
// Two spoofed headers must share the real proxy-peer limiter; do not lock out the crew.
assert.equal((await request('/api/crew/session',{password:'not-a-password'},'',{'x-forwarded-for':'192.0.2.10','cf-connecting-ip':'192.0.2.10'})).status,401);
const limits1=readDb(db=>db.prepare('select key,count from studio_security_limits').all());
assert.equal((await request('/api/crew/session',{password:'not-a-password'},'',{'x-forwarded-for':'192.0.2.11','cf-connecting-ip':'192.0.2.11'})).status,401);
const limits2=readDb(db=>db.prepare('select key,count from studio_security_limits').all());
assert.deepEqual(limits2.map(r=>r.key).sort(),limits1.map(r=>r.key).sort(),'Spoofed headers must not create a new limiter identity');
assert.ok(limits2.some(r=>limits1.some(old=>old.key===r.key&&r.count===old.count+1)));
const login=await request('/api/crew/session',{password:process.env.CREW_PORTAL_PASSWORD});
assert.equal(login.status,200,'Preserved crew login');
const session=login.headers.get('set-cookie');
assert.match(session,/HttpOnly/i);assert.match(session,/Secure/i);assert.match(session,/SameSite=strict/i);
const cookie=session.split(';')[0];
const dashboard=await request('/crew',undefined,cookie);assert.equal(dashboard.status,200);
assert.doesNotMatch(await dashboard.text(),/Booking management is almost ready/);
const payload={requestId:randomUUID(),dates:['2041-07-15','2041-07-16'],session:'morning',name:'MIGRATION PUBLIC QA - NOT A REAL BOOKING',company:'Controlled launch verification',email:'bookings@studiogq.co.za',phone:'+27845150956',additionalItems:[],message:''};
let rows=[];let confirmed=false;
try {
  const saved=await request('/api/bookings',payload);assert.equal(saved.status,201);
  const result=await saved.json();
  rows=readDb(db=>db.prepare('select id from studio_bookings where booking_group_id=? and name=?').all(result.bookingGroupId,payload.name));
  assert.equal(rows.length,2);
  assert.equal(result.notification,'sent');assert.equal(result.pendingEmail,'sent');
  assert.equal((await request('/api/bookings',{...payload,requestId:randomUUID(),session:'full_day'})).status,409);
  let pdf='%PDF-1.4\n';const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const stream='BT /F1 16 Tf 30 100 Td (MIGRATION QA - NOT A REAL QUOTE) Tj ET';objects.push('<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream');const offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});const xref=Buffer.byteLength(pdf);pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  const confirm=await request('/api/crew/bookings/'+rows[0].id,{action:'confirm',note:'Controlled launch verification. Not a real booking or quote.',quote:{filename:'migration-qa-not-a-real-quote.pdf',content:Buffer.from(pdf).toString('base64')}},cookie);
  assert.equal(confirm.status,200);assert.equal((await confirm.json()).emailStatus,'sent');confirmed=true;
  const state=readDb(db=>db.prepare('select status from studio_bookings where id=?').get(rows[0].id));assert.equal(state.status,'confirmed');
  for(const kind of ['quick_enquiry','workshop_interest']) {
    const response=await request('/api/enquiries',{kind,requestId:randomUUID(),name:'MIGRATION PUBLIC QA',email:payload.email,phone:'',message:'Controlled launch test only. No real enquiry or registration.'});
    assert.equal(response.status,201,kind);
  }
} finally {
  for(const row of rows) assert.equal((await request('/api/crew/bookings/'+row.id,{action:'cancel'},cookie)).status,200,'Release only controlled test slots');
}
assert.ok(confirmed);
readDb(db=>{for(const row of rows){assert.equal(db.prepare('select status from studio_bookings where id=?').get(row.id).status,'cancelled');assert.equal(db.prepare('select count(*) n from studio_booking_slots where booking_id=?').get(row.id).n,0)}assert.equal(db.prepare('pragma integrity_check').get().integrity_check,'ok');assert.deepEqual(db.prepare('pragma foreign_key_check').all(),[])});
console.log(JSON.stringify({checkedAt:new Date().toISOString(),commit:health.commit,publicHttps:true,crewLogin:true,secureCookies:true,csrf:true,proxySpoofProtection:true,multiDay:true,optionalProductionText:true,conflictProtection:true,internalEmail:'sent',pendingClientEmail:'sent',confirmationNoteAndQuote:'sent',quickEnquiry:'sent',workshopInterest:'sent',testBookingsCancelled:true,testIds:rows.map(r=>r.id)}));
