import fs from 'node:fs';
import path from 'node:path';
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const stamp=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
const duration=seconds=>{const rounded=Math.ceil(seconds);return `${Math.floor(rounded/60)} minutes ${String(rounded%60).padStart(2,'0')} seconds`;};
export function loadCut(root,deep){
  const scenes=JSON.parse(fs.readFileSync(path.join(root,'demo',deep?'storyboard-deep-dive.json':'storyboard.json'),'utf8'));
  const evidence=JSON.parse(fs.readFileSync(path.join(root,'test-results/video',...(deep?['deep-dive']:[]),'render-evidence.json'),'utf8'));
  if(!Number.isFinite(evidence.duration)||evidence.duration<=0||scenes.length!==evidence.scenes?.length||scenes.some((scene,index)=>scene.id!==evidence.scenes[index].id||!scene.name))throw new Error('Rendered video and storyboard do not match.');
  if(evidence.validation?.decodeExit!==0 || evidence.validation?.webDecodeExit!==0 || !Number.isFinite(evidence.validation?.actualDuration))throw new Error('Validate the newly rendered captioned and web cuts before publishing.');
  return {scenes,evidence};
}
export function loadYouTubeLinks(root){
  const file=path.join(root,'demo/youtube-release.json');
  if(!fs.existsSync(file))return {};
  const configured=JSON.parse(fs.readFileSync(file,'utf8')),links={};
  for(const key of ['short','deep']){
    const item=configured[key];
    if(item===null||item===undefined)continue;
    if(typeof item!=='string'||!/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(item))throw new Error('Invalid replacement YouTube watch URL.');
    links[key]=item;
  }
  return links;
}
export function watchPage({active,short,deep,youtube={}}){
  const selected=active==='deep'?deep:short;
  if(!selected)throw new Error('The selected cut is not ready.');
  const isDeep=active==='deep',base=isDeep?'sparecycle-backend-deep-dive':'sparecycle-review-demo';
  const {scenes,evidence}=selected;
  const title=isDeep?'Backend & business deep dive':'Competition demonstration';
  const chapters=evidence.scenes.map((scene,index)=>`<li><button type="button" data-time="${(scene.start+.35).toFixed(2)}"><span>${stamp(scene.start)}</span>${esc(scenes[index].name)}</button></li>`).join('\n');
  const transcript=scenes.map(scene=>`<h3>${esc(scene.name)}</h3><p>${esc(scene.captions.join(' '))}</p>`).join('\n');
  const youtubeItems=[['short','Competition cut'],['deep','Supporting deep dive']].filter(([key])=>youtube[key]).map(([key,label])=>`<a class="text-link" href="${esc(youtube[key])}">${label} on YouTube</a>`);
  const youtubeNav=youtubeItems.length?`<nav class="youtube-links section-note" aria-label="Watch on YouTube">${youtubeItems.join(' · ')}</nav>`:'';
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#20313f">
  <meta name="description" content="See SpareCycle's Tavily research, Nebius NVIDIA Nemotron harness, local Pilot Operations and tested draft PR workflow. Recorded synthetic proof and future investment gates stay explicit.">
  <title>${title} · SpareCycle</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/demo/demo.css"><script src="/demo/demo.js" defer></script>
</head><body>
  <a class="skip-link" href="#watch">Skip to video</a>
  <header class="site-header"><a class="brand" href="/" aria-label="SpareCycle home"><img src="/favicon.svg" width="32" height="32" alt=""><span>SpareCycle.</span></a><nav aria-label="Demo navigation"><a href="https://github.com/Golden007-prog/sparecycle">View source</a><a class="button button-small" href="/review">Open Review <span aria-hidden="true">↗</span></a></nav></header>
  <main>
    <section class="introduction" aria-labelledby="page-title"><div><p class="intro-label"><span aria-hidden="true"></span>${isDeep?'SpareCycle, behind the workflow':'SpareCycle, in practice'}</p><h1 id="page-title">${isDeep?'The backend.<br>The next step.':'Every next step.<br>With evidence.'}</h1></div><div class="intro-copy"><p>${isDeep?'Inspect real provider execution, the AI harness, the expanded workflows and the investment gates.':'Explore public-source research, pilot operations and a tested draft PR powered by Nebius and NVIDIA Nemotron.'}</p><div class="runtime"><span aria-hidden="true">▶</span> ${duration(evidence.duration)} <span class="runtime-format">Narrated in English</span></div></div></section>
    <nav class="cut-selector" aria-label="Choose a video">
      <a href="/demo/deep-dive.html"${isDeep?' aria-current="page"':''}><span class="cut-type">Backend &amp; business deep dive</span><strong>${deep?stamp(deep.evidence.duration):'Extended tour'}</strong><span>Research, operations, recorded execution, harness and the proposed roadmap.</span></a>
      <a href="/demo/competition.html"${!isDeep?' aria-current="page"':''}><span class="cut-type">Competition cut</span><strong>${stamp(short.evidence.duration)}</strong><span>The expanded product demonstration, under three minutes.</span></a>
    </nav>
    ${youtubeNav}
    <section id="watch" class="watch" aria-label="SpareCycle demonstration">
      <div class="player-topline"><span><span class="status-dot" aria-hidden="true"></span>Actual captures + explained architecture</span><span>Synthetic demonstration records</span></div>
      <video id="demo-video" controls playsinline preload="metadata" poster="/demo/${isDeep?'deep-dive-poster':'poster'}.png" aria-label="SpareCycle: ${title}" aria-describedby="video-context"><source src="/demo/${base}.mp4" type="video/mp4"><track id="english-captions" kind="captions" src="/demo/${base}.vtt" srclang="en" label="English" default>Your browser does not support this video. <a href="/demo/${base}.mp4">Download the MP4</a> or read the transcript below.</video>
      <div class="player-toolbar"><div><button id="captions-toggle" class="caption-control" type="button" aria-pressed="true" hidden><span class="cc-icon" aria-hidden="true">CC</span><span id="captions-label">Captions on</span></button><span id="chapter-status" class="chapter-status" aria-live="polite">${esc(scenes[0].name)}</span></div><a href="/demo/${base}.mp4" download="${base}.mp4">Download video <span aria-hidden="true">↓</span></a></div>
    </section>
    <section class="tour-details" aria-label="Explore the demonstration">
      <div class="chapters"><h2>${isDeep?'Explore the backend':'Follow the workflow'}</h2><p class="section-note">Choose a chapter to move through the video.</p><ol id="chapter-list">${chapters}</ol><noscript><p>Use the video controls to seek to these times. Chapter buttons require JavaScript.</p></noscript></div>
      <div class="evidence-notes"><p class="small-label">Evidence first, roadmap second</p><h2>What works.<br>What comes next.</h2>
        <p id="video-context">This edited tour combines genuine application captures with labeled diagrams and summaries of recorded execution. The demonstration records are synthetic. Nebius calls, unchanged test cases and draft pull requests were completed; replaying the video does not issue fresh requests.</p>
        <div class="result-comparison" aria-label="Recorded test results"><div><span>Original code</span><strong>1 failed</strong><small>3 test cases passed</small></div><span class="comparison-arrow" aria-hidden="true">→</span><div><span>Proposed fix</span><strong>4 passed</strong><small>The same unchanged tests</small></div></div>
        <a class="evidence-link" href="https://github.com/Golden007-prog/sparecycle/pull/1">Inspect the actual public draft PR <span aria-hidden="true">↗</span></a>
        <p>Tavily retrieves public reference sources; NVIDIA Nemotron on Nebius synthesizes the bounded evidence. Pilot Operations records local bench work. Review insights compare loaded record references without rerunning tests or granting approval.</p>
        <p>Nebius provides inference. GitHub Actions runs verification. The private pilot used an operator-configured verifier in its own repository; relevant code is sent to Nebius for inference.</p>
        <div class="reference-links"><a href="/sparecycle-project-dossier.pdf"><strong>Download the project dossier</strong><span>Product, backend proof, onboarding and investment gates.</span></a><a href="https://github.com/Golden007-prog/sparecycle/blob/main/docs/BACKEND-EVIDENCE.md"><strong>Read the backend evidence</strong><span>Recorded execution and exact scope.</span></a><a href="https://github.com/Golden007-prog/sparecycle/blob/main/docs/EXPANSION-PLAN.md"><strong>Read the 200-capability plan</strong><span>Planned work with explicit acceptance criteria.</span></a></div>
        <p class="scope-note">Workshop and Pilot Operations are browser-local and separate from authenticated Review. Manual checks do not certify physical repairs. Google login works; company email and enforced SSO remain rollout gates. Private verification supports a bounded diagnostics profile.</p>
        <p class="scope-note">The roadmap is planned work, not 200 shipped features. Pricing, paid pilots and customer outcomes remain hypotheses. The supporting deep dive is separate from the competition cut.</p>
      </div>
    </section>
    <details class="transcript"><summary>Read the full transcript</summary><div id="transcript-content">${transcript}</div></details>
    <section class="closing"><div><h2>Bring your next observation.</h2><p>Research a public model, explore a pilot and inspect the evidence behind a draft.</p></div><a class="button" href="/app?view=research">Open the Research desk <span aria-hidden="true">↗</span></a></section>
  </main>
  <footer><span>SpareCycle · A considered next step for the computers already in our hands.</span><div><a href="/demo/${base}.vtt" download="${base}.vtt">English captions</a><a href="/">Back to home</a></div></footer>
</body></html>\n`;
}
