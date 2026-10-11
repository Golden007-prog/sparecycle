import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'test-results/video/deep-dive');
const target=path.join(root,'public/demo');
const scenes=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'storyboard-deep-dive.json'),'utf8'));
const evidence=JSON.parse(fs.readFileSync(path.join(output,'render-evidence.json'),'utf8'));
const shortVideo=path.join(target,'sparecycle-review-demo.mp4');
const expectedShortHash='00deb79d080ede8e0fe67e4b5369a443a76145f8ff9f4f85e0ba93607cf9cb96';
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(shortVideo)).digest('hex');
if(hash()!==expectedShortHash)throw new Error('Competition cut changed; check before publishing.');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const stamp=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const roundedSeconds=Math.round(evidence.duration);
const minutes=`${Math.floor(roundedSeconds/60)} minutes ${String(roundedSeconds%60).padStart(2,'0')} seconds`;
const competition=path.join(target,'competition.html');
let base=fs.readFileSync(fs.existsSync(competition)?competition:path.join(target,'index.html'),'utf8');
base=base.replace(/\s*<nav class="cut-selector"[\s\S]*?<\/nav>/,'');
base=base.replace('Company email delivery and organization SSO still need provider configuration.','Google sign-in works. Custom company email remains deferred. Managed SSO needs identity-policy enforcement and deprovisioning, as well as provider setup.');
const selector=active=>`\n    <nav class="cut-selector" aria-label="Choose a video">
      <a href="/demo/deep-dive.html"${active==='deep'?' aria-current="page"':''}><span class="cut-type">Backend &amp; business deep dive</span><strong>${stamp(evidence.duration)}</strong><span>Recorded execution, AI harness, best use and the proposed roadmap.</span></a>
      <a href="/demo/competition.html"${active==='short'?' aria-current="page"':''}><span class="cut-type">Competition cut</span><strong>2:59</strong><span>The original product demonstration, preserved under three minutes.</span></a>
    </nav>\n`;
const insertSelector=(html,active)=>html.replace('    <section id="watch"',selector(active)+'    <section id="watch"');
let short=base.replace(/<title>.*?<\/title>/,'<title>Competition demo · SpareCycle</title>');
fs.writeFileSync(competition,insertSelector(short,'short'));
let html=base
  .replace(/<title>.*?<\/title>/,'<title>Backend &amp; business deep dive · SpareCycle</title>')
  .replace(/<meta name="description"[^>]+>/,'<meta name="description" content="Inspect SpareCycle’s recorded Nebius and NVIDIA Nemotron backend execution, its AI harness, the best initial workflow and an explicitly future investment roadmap.">')
  .replace('SpareCycle Review, in practice','SpareCycle Review, behind the workflow')
  .replace('One change.<br>Clear evidence.','The backend.<br>The next step.')
  .replace('Follow a laptop observation through a Nebius investigation, isolated tests and a real draft pull request.','See what really runs, how the AI harness controls it, and what a focused investment should unlock.')
  .replace(/2 minutes 59 seconds/g,minutes)
  .replaceAll('sparecycle-review-demo','sparecycle-backend-deep-dive')
  .replace('poster="/demo/poster.png"','poster="/demo/deep-dive-poster.png"')
  .replace('SpareCycle Review: evidence to a tested draft pull request','SpareCycle Review: recorded backend execution, controls and future roadmap')
  .replace('Actual application captures','Recorded execution + explained architecture')
  .replace('Product introduction','The best first use case')
  .replace('Follow the change','Explore the backend and next steps');
// Seek beyond the fade and small encoder time-base rounding so paused selections are readable.
html=html.replace(/<ol id="chapter-list">[\s\S]*?<\/ol>/,`<ol id="chapter-list">\n${evidence.scenes.map((s,i)=>`        <li><button type="button" data-time="${(s.start+.35).toFixed(2)}"><span>${stamp(s.start)}</span>${esc(scenes[i].name)}</button></li>`).join('\n')}\n      </ol>`);
html=html.replace(/<div id="transcript-content">[\s\S]*?<\/div><\/details>/,`<div id="transcript-content">\n${scenes.map(s=>`      <h3>${esc(s.name)}</h3><p>${esc(s.captions.join(' '))}</p>`).join('\n')}\n    </div></details>`);
html=html.replace(/<div class="evidence-notes">[\s\S]*?<\/div>\s*<\/section>/,`<div class="evidence-notes">
      <p class="small-label">Evidence first, roadmap second</p><h2>What works.<br>What comes next.</h2>
      <p id="video-context">The walkthrough combines actual application captures with labeled architecture diagrams and summaries of recorded backend execution. Synthetic fixtures are explicit. The Nebius calls, unchanged test cases and draft pull requests were completed; replaying this video does not issue fresh requests.</p>
      <div class="result-comparison" aria-label="Test results"><div><span>Original code</span><strong>1 failed</strong><small>3 test cases passed</small></div><span class="comparison-arrow" aria-hidden="true">→</span><div><span>Proposed fix</span><strong>4 passed</strong><small>Same test cases</small></div></div>
      <a class="evidence-link" href="https://github.com/Golden007-prog/sparecycle/pull/1">Inspect the public draft PR <span aria-hidden="true">↗</span></a>
      <p>Nebius Token Factory hosts NVIDIA Nemotron inference. GitHub Actions runs the tests. The private pilot exercised an operator-configured verifier in its own repository; relevant code is sent to Nebius for inference.</p>
      <div class="reference-links"><a href="https://github.com/Golden007-prog/sparecycle/blob/main/docs/BACKEND-EVIDENCE.md"><strong>Read the backend evidence</strong><span>Architecture, recorded execution and exact scope.</span></a><a href="https://github.com/Golden007-prog/sparecycle/blob/main/docs/INVESTMENT-ROADMAP.md"><strong>Read the investment roadmap</strong><span>Proposed milestones, acceptance gates and pilot metrics.</span></a></div>
      <p class="scope-note">Google sign-in works. Custom company email remains deferred. Managed SSO needs identity enforcement and deprovisioning, as well as provider setup. Workshop and Review do not yet share operational records. A software test does not certify a physical repair.</p>
      <p class="scope-note">Roadmap items, paid pilots, subscription pricing and customer outcomes are future hypotheses, not shipped functionality or measured returns. This longer video is separate from the preserved competition cut.</p>
      <a class="text-link" href="https://github.com/Golden007-prog/sparecycle/blob/main/docs/REVIEW-COMPANY-SETUP.md">Read the current company setup guide</a>
    </div>\n    </section>`);
html=insertSelector(html,'deep');
fs.writeFileSync(path.join(target,'deep-dive.html'),html);
fs.writeFileSync(path.join(target,'index.html'),html);
// Selectable web captions, with a separate burned-in-caption local upload copy.
fs.copyFileSync(path.join(output,'assembly.mp4'),path.join(target,'sparecycle-backend-deep-dive.mp4'));
fs.copyFileSync(path.join(output,'sparecycle-backend-deep-dive.vtt'),path.join(target,'sparecycle-backend-deep-dive.vtt'));
fs.copyFileSync(path.join(output,'01-intro.png'),path.join(target,'deep-dive-poster.png'));
if(hash()!==expectedShortHash)throw new Error('Competition cut was modified.');
console.log({publishedLocal:true,chapters:scenes.length,seconds:evidence.duration,competitionHash:hash(),deepVideoBytes:fs.statSync(path.join(target,'sparecycle-backend-deep-dive.mp4')).size});
