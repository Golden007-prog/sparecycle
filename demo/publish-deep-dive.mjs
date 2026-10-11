import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadCut, watchPage, loadYouTubeLinks } from './publish-shared.mjs';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'test-results/video/deep-dive');
const target=path.join(root,'public/demo');
const pagesOnly=process.argv.includes('--pages-only');
const short=loadCut(root,false),deep=loadCut(root,true);
const receipt=JSON.parse(fs.readFileSync(path.join(root,'test-results/video/published-competition.json'),'utf8'));
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(path.join(target,'sparecycle-review-demo.mp4'))).digest('hex');
if(hash()!==receipt.sha256||short.evidence.duration!==receipt.duration||JSON.stringify(short.scenes.map(s=>s.id))!==JSON.stringify(receipt.sceneIds))throw new Error('Competition media differs from its intentional publication receipt.');
if(short.evidence.duration>=180)throw new Error('Competition video exceeds three minutes.');
if(!pagesOnly){
  fs.copyFileSync(path.join(output,'assembly.mp4'),path.join(target,'sparecycle-backend-deep-dive.mp4'));
  fs.copyFileSync(path.join(output,'sparecycle-backend-deep-dive.vtt'),path.join(target,'sparecycle-backend-deep-dive.vtt'));
  fs.copyFileSync(path.join(output,'01-intro.png'),path.join(target,'deep-dive-poster.png'));
}
const youtube=loadYouTubeLinks(root);
fs.writeFileSync(path.join(target,'competition.html'),watchPage({active:'short',short,deep,youtube}));
const html=watchPage({active:'deep',short,deep,youtube});
fs.writeFileSync(path.join(target,'deep-dive.html'),html);
fs.writeFileSync(path.join(target,'index.html'),html);
if(hash()!==receipt.sha256)throw new Error('Deep publication changed the competition cut.');
console.log({publishedLocal:true,pagesOnly,chapters:deep.scenes.length,seconds:deep.evidence.duration,competitionHash:hash(),deepVideoBytes:fs.statSync(path.join(target,'sparecycle-backend-deep-dive.mp4')).size});
