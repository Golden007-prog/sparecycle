import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadCut, watchPage, loadYouTubeLinks } from './publish-shared.mjs';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'test-results/video');
const target=path.join(root,'public/demo');
const pagesOnly=process.argv.includes('--pages-only');
const short=loadCut(root,false);
if(short.evidence.duration>=180)throw new Error('Competition video must be shorter than three minutes.');
if(!pagesOnly){
  fs.copyFileSync(path.join(output,'assembly.mp4'),path.join(target,'sparecycle-review-demo.mp4'));
  fs.copyFileSync(path.join(output,'sparecycle-review-demo.vtt'),path.join(target,'sparecycle-review-demo.vtt'));
  fs.copyFileSync(path.join(output,'01-intro.png'),path.join(target,'poster.png'));
}
const competitionHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(target,'sparecycle-review-demo.mp4'))).digest('hex');
// An intentional publication records the replacement digest. Deep publication
// checks this receipt rather than silently accepting any competition media.
const receiptPath=path.join(output,'published-competition.json');
if(!pagesOnly)fs.writeFileSync(receiptPath,JSON.stringify({publishedAt:new Date().toISOString(),sha256:competitionHash,duration:short.evidence.duration,sceneIds:short.scenes.map(s=>s.id)},null,2));
else if(JSON.parse(fs.readFileSync(receiptPath,'utf8')).sha256!==competitionHash)throw new Error('Competition media differs from its receipt.');
let deep;
try { deep=loadCut(root,true); } catch { /* Extended cut may still be rendering. */ }
fs.writeFileSync(path.join(target,'competition.html'),watchPage({active:'short',short,deep,youtube:loadYouTubeLinks(root)}));
console.log({publishedLocal:true,pagesOnly,chapters:short.scenes.length,seconds:short.evidence.duration,competitionHash,webVideoBytes:fs.statSync(path.join(target,'sparecycle-review-demo.mp4')).size});
