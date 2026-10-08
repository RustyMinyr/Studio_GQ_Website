#!/usr/bin/env python3
"""Fixed, sanitized observations; runs in the existing root collector, never the app."""
import datetime as dt, hashlib, json, pathlib, sqlite3, subprocess, tempfile, os
ROOT=pathlib.Path('/var/lib/studio-gq-backup')
OUTPUT=pathlib.Path('/var/lib/dasu-monitoring/studio-gq.json')
CONTAINER='lhosiqfbxr4x6uqbwtjvetka'
def command(args):
    try:
        r=subprocess.run(args,capture_output=True,text=True,timeout=8)
        return r.returncode==0,r.stdout[:4096].strip()
    except (OSError,subprocess.TimeoutExpired):return False,''
def collect():
    now=dt.datetime.now(dt.timezone.utc)
    result={'schemaVersion':1,'site':'Studio GQ','url':'https://www.studiogq.co.za',
            'collectedAt':now.isoformat(),'source':'same_host','externalOutageDetection':False,
            'container':'unknown','health':'unknown','database':'unknown','commit':None,
            'backup':{'status':'unknown','lastSuccess':None},'deploymentPhase':'private_pre_cutover'}
    ok,raw=command(['/usr/bin/docker','inspect','--format','{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{end}}',CONTAINER])
    if ok:
        state,health=(raw+'|').split('|')[:2]
        result['container']=state if state in ('running','exited','restarting','paused','created') else 'unknown'
        result['health']=health if health in ('healthy','unhealthy','starting') else 'unknown'
        ok,raw=command(['/usr/bin/docker','exec',CONTAINER,'node','-e',"fetch('http://127.0.0.1:3000/api/health').then(r=>r.json()).then(v=>console.log(JSON.stringify(v)))"])
        if ok:
            try:
                commit=json.loads(raw).get('commit')
                if isinstance(commit,str) and len(commit)==40 and all(c in '0123456789abcdef' for c in commit):result['commit']=commit
            except (ValueError,AttributeError):pass
    try:
        db=sqlite3.connect('file:/srv/studio-gq/production/data/studio-gq.db?mode=ro',uri=True,timeout=2)
        result['database']='ok' if db.execute('pragma quick_check').fetchall()==[('ok',)] else 'failed'
        db.close()
    except sqlite3.Error:pass
    try:
        last=(ROOT/'last-success').read_text().strip()
        timestamp=dt.datetime.fromisoformat(last.replace('Z','+00:00'))
        age=(now-timestamp).total_seconds()
        result['backup']={'status':'recent' if 0<=age<26*3600 else 'overdue','lastSuccess':last}
    except (OSError,ValueError):pass
    if pathlib.Path('/srv/studio-gq/config/cutover-complete').exists():result['deploymentPhase']='live'
    return result
def write_snapshot(result):
    OUTPUT.parent.mkdir(exist_ok=True)
    fd,temp=tempfile.mkstemp(prefix='.studio-gq-',dir=OUTPUT.parent)
    with os.fdopen(fd,'w') as f:json.dump(result,f);f.flush();os.fsync(f.fileno())
    os.chmod(temp,0o644);os.replace(temp,OUTPUT)
if __name__=='__main__':write_snapshot(collect())
