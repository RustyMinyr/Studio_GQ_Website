import assert from 'node:assert/strict';
import { readdirSync,readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join,relative } from 'node:path';
const origin=process.argv[2];
if(origin!=='http://localhost:3042')throw new Error('This test targets the private migration tunnel only.');
const routes=['/','/booking','/services','/resources','/privacy','/terms',
'/services/studio-hire','/services/photography-film','/services/podcast-studio','/services/greenscreen-infinity-curve','/services/equipment-production-support',
'/resources/studio-lighting-basics','/resources/stills-vs-video-lighting','/resources/clean-interview-sound','/resources/podcast-studio-setup-guide',
'/resources/greenscreen-shoot-preparation','/resources/infinity-curve-shooting-guide','/resources/half-day-vs-full-day-studio-hire','/resources/studio-production-day-checklist'];
for(const route of routes){
  const r=await fetch(origin+route);assert.equal(r.status,200,route);
  assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.doesNotMatch(r.headers.get('content-security-policy'),/unsafe-eval/);
  const html=await r.text();
  assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,route+' heading');
  assert.equal((html.match(/<main[\s>]/g)||[]).length,1,route+' main');
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,route+' canonical');
  assert.doesNotMatch(html,/sb_secret_|re_[A-Za-z0-9]{24,}/,route+' secret scan');
}
for(const [path,destination] of Object.entries({'/about':'/#about','/spaces':'/#about','/equipment':'/#equipment','/faq':'/#faq','/contact':'/#contact','/gallery':'/'})){
  const r=await fetch(origin+path,{redirect:'manual'});assert.equal(r.status,308);const u=new URL(r.headers.get('location'),origin);assert.equal(u.pathname+u.hash,destination);
}
assert.equal((await fetch(origin+'/crew',{redirect:'manual'})).status,307);
const health=await (await fetch(origin+'/api/health')).json();assert.equal(health.status,'ok');
let files=0,bytes=0;
async function walk(folder){for(const entry of readdirSync(folder,{withFileTypes:true})){
  const path=join(folder,entry.name);if(entry.isDirectory())await walk(path);else if(entry.isFile()){
    const source=readFileSync(path);const url=relative('public',path).split(/[\\/]/).map(encodeURIComponent).join('/');
    const response=await fetch(origin+'/'+url);assert.equal(response.status,200,url);const deployed=Buffer.from(await response.arrayBuffer());
    assert.equal(createHash('sha256').update(deployed).digest('hex'),createHash('sha256').update(source).digest('hex'),url);files++;bytes+=source.length;
  }
}}
await walk('public');
const evidence={commit:health.commit,publicPages:routes.length,assetFiles:files,assetBytes:bytes,allHashesMatch:true,checkedAt:new Date().toISOString()};
writeFileSync('.migration/deployed-evidence.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
