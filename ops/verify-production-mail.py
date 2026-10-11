#!/usr/bin/env python3
"""Controlled app-driven mail verification. Only a new, empty isolated database."""
import json, pathlib, shutil, sqlite3, subprocess, time, uuid

NAME='studio-gq-mail-check-20261011'
APP='lhosiqfbxr4x6uqbwtjvetka'
ROOT=pathlib.Path('/srv/studio-gq/mail-test-20261011')
if subprocess.run(['docker','inspect',NAME],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0:
    raise SystemExit('Mail test already exists; retain its evidence and review before retrying')
if ROOT.exists(): raise SystemExit('Mail-test directory already exists; do not overwrite it')
ROOT.mkdir(mode=0o700)
target=ROOT/'data';target.mkdir(mode=0o700)
source=pathlib.Path('/srv/studio-gq/production/data/studio-gq.db')
with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as old,sqlite3.connect(target/'studio-gq.db') as db:
    schema=old.execute("select sql from sqlite_master where sql is not null and name not like 'sqlite_%' and type in ('table','index') order by case type when 'table' then 0 else 1 end").fetchall()
    for (sql,) in schema: db.execute(sql)
    db.commit()
shutil.chown(target,1000,1000)
(target/'studio-gq.db').chmod(0o600);shutil.chown(target/'studio-gq.db',1000,1000)
runtime=json.loads(pathlib.Path('/srv/studio-gq/config/mail-runtime.json').read_text())
keys=['RESEND_API_KEY','BOOKING_FROM_EMAIL','BOOKING_NOTIFICATION_EMAIL']
values={k:runtime[k] for k in keys}
if values['BOOKING_NOTIFICATION_EMAIL']!='bookings@studiogq.co.za' or values['BOOKING_FROM_EMAIL']!='Studio GQ <web@rooiko.com>':
    raise SystemExit('Unexpected mail destination or sender')
values.update(STUDIO_DATABASE_PATH='/app/data/studio-gq.db',APP_ORIGIN='http://localhost:3042',
    EMAIL_DELIVERY_DISABLED='0',MIGRATION_READ_ONLY='0',CREW_PORTAL_EMAIL='bookings@studiogq.co.za',
    CREW_PORTAL_PASSWORD=str(uuid.uuid4()),CREW_SESSION_SECRET=str(uuid.uuid4())+str(uuid.uuid4()))
image=subprocess.check_output(['docker','inspect','--format','{{.Config.Image}}',APP],text=True).strip()
commit=image.rsplit(':',1)[-1]
if len(commit)!=40 or any(c not in '0123456789abcdef' for c in commit): raise SystemExit('Expected a commit-tagged production image')
values['SOURCE_COMMIT']=commit
if any('\n' in v or '\r' in v for v in values.values()): raise SystemExit('Multiline values unsupported')
env=ROOT/'runtime.env';env.write_text('\n'.join(k+'='+v for k,v in values.items())+'\n');env.chmod(0o600)
subprocess.run(['docker','run','-d','--name',NAME,'--network','studio-gq-production','--env-file',str(env),
    '--cap-drop','ALL','--security-opt','no-new-privileges','-v',str(target)+':/app/data',image],stdout=subprocess.DEVNULL,check=True)
js=r"""
const assert=require('node:assert/strict'); const {randomUUID}=require('node:crypto');const {DatabaseSync}=require('node:sqlite');
const base='http://127.0.0.1:3000';const origin=process.env.APP_ORIGIN;
async function request(path,body,cookie=''){return fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'manual'});}
(async()=>{
 let health;for(let i=0;i<40;i++){try{let r=await request('/api/health');if(r.ok){health=await r.json();break}}catch{}await new Promise(r=>setTimeout(r,1000))}assert.ok(health);assert.equal(health.commit,process.env.SOURCE_COMMIT);
 const booking={requestId:randomUUID(),dates:['2040-04-10','2040-04-11'],session:'morning',name:'ISOLATED MIGRATION EMAIL TEST',company:'Not a real production',email:'bookings@studiogq.co.za',phone:'+27845150956',additionalItems:[],message:''};
 let response=await request('/api/bookings',booking);assert.equal(response.status,201);let saved=await response.json();assert.equal(saved.notification,'sent');assert.equal(saved.pendingEmail,'sent');
 const db=new DatabaseSync(process.env.STUDIO_DATABASE_PATH);const rows=db.prepare('select id from studio_bookings where booking_group_id=? order by booking_date').all(saved.bookingGroupId);assert.equal(rows.length,2);db.close();
 response=await request('/api/crew/session',{password:process.env.CREW_PORTAL_PASSWORD});assert.equal(response.status,200);const cookie=response.headers.get('set-cookie').split(';')[0];
 // A real, small one-page PDF. Byte offsets are generated for its xref table.
 let pdf='%PDF-1.4\n';const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const stream='BT /F1 16 Tf 30 100 Td (MIGRATION TEST - NOT A REAL QUOTE) Tj ET';objects.push('<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream');let offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});const xref=Buffer.byteLength(pdf);pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
 response=await request('/api/crew/bookings/'+rows[0].id,{action:'confirm',note:'Controlled migration verification only. This is not a real booking or quote.',quote:{filename:'migration-test-not-a-real-quote.pdf',content:Buffer.from(pdf).toString('base64')}},cookie);assert.equal(response.status,200);const confirmed=await response.json();assert.equal(confirmed.emailStatus,'sent');
 for(const row of rows){assert.equal((await request('/api/crew/bookings/'+row.id,{action:'cancel'},cookie)).status,200)}
 const check=new DatabaseSync(process.env.STUDIO_DATABASE_PATH);assert.equal(check.prepare('select count(*) n from studio_booking_slots').get().n,0);assert.equal(check.prepare('pragma integrity_check').get().integrity_check,'ok');assert.equal(check.prepare('select count(*) n from studio_bookings where status=?').get('cancelled').n,2);check.close();
 console.log(JSON.stringify({commit:health.commit,checkedAt:new Date().toISOString(),isolated:true,recipient:booking.email,notification:'sent',pendingEmail:'sent',confirmationEmail:'sent',noteAndPdfQuote:true,multiDayRows:2,slotsReleased:true}));
})().catch(()=>{console.error('CONTROLLED_APPLICATION_MAIL_TEST_FAILED');process.exit(1)});
"""
try:
    result=subprocess.run(['docker','exec',NAME,'node','-e',js],capture_output=True,text=True)
    if result.returncode: raise SystemExit('Controlled application mail verification failed; isolated data retained')
    evidence=json.loads(result.stdout.strip());(ROOT/'evidence.json').write_text(json.dumps(evidence,indent=2))
    print(json.dumps(evidence))
finally:
    subprocess.run(['docker','stop',NAME],stdout=subprocess.DEVNULL,check=True)
    # Retain the stopped isolated container and evidence. No live records changed.
