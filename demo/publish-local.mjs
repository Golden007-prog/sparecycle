import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'test-results/video');
const target=path.join(root,'public/demo');
const scenes=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'storyboard.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(output,'render-evidence.json'),'utf8'));
const names=['Meet SpareCycle Review','The company workspace','The laptop passport','A clearly defined failure','Nebius cloud inference','NVIDIA Nemotron routing','Four-model usage evidence','The execution harness','The bounded patch','Prove the failure and fix','Review the tested change','The real draft pull request','The private-repository pilot','The recovery workflow','What the demo proves','Try it for yourself'];
if(names.length!==scenes.length)throw new Error('Update chapter labels for the new storyboard.');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const timestamp=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const page=fs.existsSync(path.join(target,'competition.html'))?'competition.html':'index.html';
let html=fs.readFileSync(path.join(target,page),'utf8');
// The visible timestamp marks the chapter; the seek avoids its opening transition.
html=html.replace(/<ol id="chapter-list">[\s\S]*?<\/ol>/,`<ol id="chapter-list">\n${evidence.scenes.map((s,i)=>`        <li><button type="button" data-time="${(s.start+.35).toFixed(2)}"><span>${timestamp(s.start)}</span>${names[i]}</button></li>`).join('\n')}\n      </ol>`);
html=html.replace(/<div id="transcript-content">[\s\S]*?<\/div><\/details>/,`<div id="transcript-content">\n${scenes.map((s,i)=>`      <h3>${names[i]}</h3><p>${esc(s.captions.join(' '))}</p>`).join('\n')}\n    </div></details>`);
html=html.replace(/\d minutes \d{2} seconds/g,`${Math.floor(evidence.duration/60)} minutes ${Math.ceil(evidence.duration%60)} seconds`);
fs.writeFileSync(path.join(target,page),html);
// The web copy has no burned-in captions so the accessible VTT track can be toggled.
// The separate local deliverable keeps burned-in captions for upload convenience.
fs.copyFileSync(path.join(output,'assembly.mp4'),path.join(target,'sparecycle-review-demo.mp4'));
fs.copyFileSync(path.join(output,'sparecycle-review-demo.vtt'),path.join(target,'sparecycle-review-demo.vtt'));
fs.copyFileSync(path.join(output,'01-intro.png'),path.join(target,'poster.png'));
console.log({publishedLocal:true,chapters:scenes.length,seconds:evidence.duration,webVideoBytes:fs.statSync(path.join(target,'sparecycle-review-demo.mp4')).size});
