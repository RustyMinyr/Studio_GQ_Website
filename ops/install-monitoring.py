#!/usr/bin/env python3
import pathlib, shutil, subprocess
root=pathlib.Path('/home/codex-admin/studio-gq-migration')
target=pathlib.Path('/usr/local/lib/dasu-monitoring/studio-gq.py')
shutil.copyfile(root/'monitor.py',target);target.chmod(0o755)
collector=pathlib.Path('/usr/local/sbin/collect-rooiko-status')
marker='# BEGIN STUDIO GQ MONITORING'
text=collector.read_text()
if marker not in text:
    shutil.copyfile(collector,root/'collect-rooiko-status.before-studio-gq')
    with collector.open('a') as f:f.write('''
# BEGIN STUDIO GQ MONITORING
try:
    import runpy as _sgq_runpy
    _sgq_module=_sgq_runpy.run_path('/usr/local/lib/dasu-monitoring/studio-gq.py',run_name='studio_gq_module')
    _sgq_module['write_snapshot'](_sgq_module['collect']())
except Exception:
    print('STUDIO_GQ_COLLECTION_UNAVAILABLE')
# END STUDIO GQ MONITORING
''')
inventory=pathlib.Path('/usr/local/lib/dasu-monitoring/servers.py')
text=inventory.read_text()
needle='''        match = IMAGE_RE.fullmatch(str(item.get("Image", "")))'''
replacement='''        # Fixed local-image identities, without container env/labels/IDs in output.
        image = str(item.get("Image", ""))
        studio_names = {"lhosiqfbxr4x6uqbwtjvetka": "studio-gq", "i6niok9h83f4nijpfjw3o8xh": "studio-gq-staging"}
        studio_name = studio_names.get(image.split(":", 1)[0])
        if studio_name:
            state = str(item.get("State", "")).lower()
            apps[studio_name] = {"name": studio_name, "state": state if state in ("running", "exited", "created", "paused", "restarting") else "unknown"}
            continue
        match = IMAGE_RE.fullmatch(str(item.get("Image", "")))'''
if '# Fixed local-image identities' not in text:
    if text.count(needle)!=1:raise SystemExit('Inventory contract changed; refusing patch')
    shutil.copyfile(inventory,root/'servers.py.before-studio-gq')
    inventory.write_text(text.replace(needle,replacement))
subprocess.run(['python3','-m','py_compile',str(target),str(inventory),str(collector)],check=True)
subprocess.run(['systemctl','start','rooiko-monitoring.service'],check=True)
print('STUDIO_GQ_MONITORING_REGISTERED')
