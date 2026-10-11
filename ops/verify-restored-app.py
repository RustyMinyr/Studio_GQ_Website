#!/usr/bin/env python3
"""Starts an isolated container on the restored snapshot. No public ports or emails."""
import pathlib, json, shutil, subprocess, time, sqlite3
ROOT=pathlib.Path('/var/lib/studio-gq-backup')
name='studio-gq-restore-check'
if subprocess.run(['docker','inspect',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0:raise SystemExit('Restore test already exists; inspect before retrying')
restores=sorted(ROOT.glob('restore-*'))
if not restores:raise SystemExit('Run an isolated restore first')
source=restores[-1]/'var/lib/studio-gq-backup/staging/data/studio-gq.db'
target=pathlib.Path('/srv/studio-gq/restore-test/data');target.mkdir(parents=True,exist_ok=True)
if (target/'studio-gq.db').exists():raise SystemExit('Restore database already exists; retain it and use a reviewed fresh test destination')
with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as old,sqlite3.connect(target/'studio-gq.db') as db:old.backup(db)
target.chmod(0o700);shutil.chown(target,1000,1000)
(target/'studio-gq.db').chmod(0o600);shutil.chown(target/'studio-gq.db',1000,1000)
runtime=json.loads(pathlib.Path('/srv/studio-gq/config/runtime.json').read_text())
values={k:v for k,v in runtime.items() if k.startswith('CREW_')}
values.update(STUDIO_DATABASE_PATH='/app/data/studio-gq.db',EMAIL_DELIVERY_DISABLED='1',APP_ORIGIN='http://localhost:3042')
if any('\n' in v or '\r' in v for v in values.values()):raise SystemExit('Multiline runtime values are not supported')
env=ROOT/'restore-runtime.env'
env.write_text('\n'.join(k+'='+v for k,v in values.items())+'\n');env.chmod(0o600)
image=subprocess.check_output(['docker','inspect','--format','{{.Config.Image}}','i6niok9h83f4nijpfjw3o8xh'],text=True).strip()
subprocess.run(['docker','run','-d','--name',name,'--network','studio-gq-staging','--env-file',str(env),'-v',str(target)+':/app/data',image],stdout=subprocess.DEVNULL,check=True)
try:
    js="""const assert=require('assert'); const base='http://127.0.0.1:3000';
    (async()=>{let h=await fetch(base+'/api/health');assert.equal(h.status,200);
    let login=await fetch(base+'/api/crew/session',{method:'POST',headers:{Origin:process.env.APP_ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({password:process.env.CREW_PORTAL_PASSWORD})});assert.equal(login.status,200);
    let cookie=login.headers.get('set-cookie').split(';')[0];let page=await fetch(base+'/crew',{headers:{Cookie:cookie}});assert.equal(page.status,200);assert.match(await page.text(),/The booking day, in view/);
    console.log('RESTORED_APPLICATION_HEALTH_LOGIN_DASHBOARD_PASS')})().catch(e=>{console.error('RESTORE_APPLICATION_CHECK_FAILED');process.exit(1)})"""
    for attempt in range(30):
        r=subprocess.run(['docker','exec',name,'node','-e',js],capture_output=True,text=True)
        if r.returncode==0:print(r.stdout.strip());break
        time.sleep(1)
    else:raise SystemExit('Restored application failed')
finally:
    subprocess.run(['docker','stop',name],stdout=subprocess.DEVNULL,check=True)
    # Keep stopped isolated container and snapshot for inspection; no original data touched.
