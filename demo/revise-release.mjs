import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Explicit editorial migration for the Tavily / Operations release. The first
// invocation preserves original media and storyboards; later invocations reuse
// those originals rather than repeatedly expanding the replacement storyboard.
const root = path.resolve(import.meta.dirname, '..');
const previous = path.join(root, 'test-results/video/previous-release');
fs.mkdirSync(previous, { recursive: true });
const preserve = (source, destination) => {
  const from = path.join(root, source), to = path.join(previous, destination);
  if (fs.existsSync(from) && !fs.existsSync(to)) fs.copyFileSync(from, to);
};
for (const [from, to] of [
  ['demo/storyboard.json', 'storyboard.json'],
  ['demo/storyboard-deep-dive.json', 'storyboard-deep-dive.json'],
  ['test-results/video/sparecycle-review-demo.mp4', 'competition-captioned.mp4'],
  ['test-results/video/sparecycle-review-demo.vtt', 'competition.vtt'],
  ['test-results/video/render-evidence.json', 'competition-render-evidence.json'],
  ['test-results/video/deep-dive/sparecycle-backend-deep-dive.mp4', 'deep-dive-captioned.mp4'],
  ['test-results/video/deep-dive/sparecycle-backend-deep-dive.vtt', 'deep-dive.vtt'],
  ['test-results/video/deep-dive/render-evidence.json', 'deep-dive-render-evidence.json'],
  ['public/demo/sparecycle-review-demo.mp4', 'competition-web.mp4'],
  ['public/demo/sparecycle-backend-deep-dive.mp4', 'deep-dive-web.mp4'],
  ['public/demo/competition.html', 'competition.html'],
  ['public/demo/deep-dive.html', 'deep-dive.html'],
]) preserve(from, to);
const manifest = fs.readdirSync(previous).filter(name => name !== 'manifest.json').map(name => {
  const bytes = fs.readFileSync(path.join(previous, name));
  return { name, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
});
fs.writeFileSync(path.join(previous, 'manifest.json'), JSON.stringify({ preservedAt: new Date().toISOString(), files: manifest, note: 'Preserved original local releases. No remote video deletion or publication is performed.' }, null, 2));

const previousShort = JSON.parse(fs.readFileSync(path.join(previous, 'storyboard.json'), 'utf8'));
const previousDeep = JSON.parse(fs.readFileSync(path.join(previous, 'storyboard-deep-dive.json'), 'utf8'));
const existing = (id, edits = {}) => ({ ...structuredClone(previousShort.find(scene => scene.id === id)), ...edits });
const research = {
  id: '02b-research', name: 'Tavily research with Nebius synthesis', chapter: 'PUBLIC REFERENCE RESEARCH',
  title: 'Find the source.\nKeep the caveats.', eyebrow: 'TAVILY SEARCH + NEBIUS NEMOTRON',
  detail: 'Official documentation sources.\nChecked citation references.\nUncertainty stays visible.',
  image: 'research-release.jpg', crop: [1355, 315, 1295, 710], label: 'Actual local runtime result · Tavily + Nebius · Reference only',
  captions: ['The Research desk calls Tavily for official documentation at runtime. NVIDIA Nemotron on Nebius summarizes bounded sources with checked citation IDs, uncertainties and next checks. Search does not approve a repair.'],
};
const operations = {
  id: '02a-operations', name: 'From planning to Pilot Operations', chapter: 'WORKSHOP + PILOT OPERATIONS',
  title: 'From a plan.\nTo bench notes.\nTo a handoff.', eyebrow: 'BROWSER-LOCAL PILOT RECORDS',
  detail: 'Freeze a proposal. Record effort.\nKeep blockers and evidence.\nExport the next handoff.',
  image: 'pilot-release.jpg', crop: [990, 440, 1660, 715], label: 'Actual app capture · Synthetic local pilot · No physical certification',
  captions: ['Workshop allocates declared parts, time and budget. Pilot Operations freezes a plan, records bench progress, actual effort and evidence checks, then exports a local handoff. Physical release still needs technician judgment.'],
};
const queue = {
  id: '10-review-queue', name: 'Review insights and attention queue', chapter: 'REVIEW INSIGHTS',
  title: 'See what needs\na closer look.', eyebrow: 'READ-ONLY WORKFLOW INSIGHTS',
  detail: 'Evidence and proof references.\nDelayed work and missing records.\nServer authority stays intact.',
  image: 'review-queue-release.jpg', crop: [1080, 202, 1470, 795], label: 'Actual app capture · Synthetic queue · Loaded-record checks only',
  captions: ['Review insights surface stale evidence, delayed jobs and work needing attention. They compare loaded record references; the server still decides which actions are allowed.'],
};
const short = [
  existing('01-intro', { name: 'Meet the balanced SpareCycle workflow', captions: ['SpareCycle helps teams use the laptops they already have, and fix the diagnostic software behind them. This is a working prototype using synthetic demonstration records.'] }),
  operations,
  research,
  existing('03-evidence', { name: 'The organization, passport and parser failure', detail: 'A valid 0% battery log returns null.\nVersioned evidence defines the failure.', captions: ["Organization access protects the Review workspace. This laptop's evidence records a concrete bug: a valid zero-percent battery reading is discarded as missing data."] }),
  existing('05a-provider', { name: 'Nebius hosts NVIDIA inference', captions: ['Nebius Token Factory supplies actual NVIDIA inference. The server sends bounded requests, without exposing provider credentials to the browser.'] }),
  existing('05-nebius', { name: 'Models have explicit stage roles', captions: ['Lightning investigated this public case; Super wrote and freshly reviewed the patch. Nano and opt-in Ultra were separately exercised.'] }),
  existing('05b-usage', { name: 'Recorded usage across four tiers', captions: ['Recorded Nebius usage shows four tiers. These rounded cost buckets are not a per-change invoice or a quality benchmark.'] }),
  existing('05c-harness', { name: 'The trusted AI harness', captions: ['The harness enforces structured output, a forty-second model deadline and reserved spend. Models have no shell or publishing tools. Code and evidence hashes bind tests and approval; LangSmith records metadata.'] }),
  existing('06-patch', { name: 'One bounded parser candidate', captions: ['The proposed change targets one pure JavaScript diagnostic parser. Existing tests and the repository version are pinned before execution.'] }),
  existing('07-tests', { name: 'Prove failure, then pass the same tests', captions: ['Real GitHub Actions verification first reproduces the defect: three tests pass, one fails. The exact candidate then passes all four unchanged tests in an isolated container.'] }),
  existing('08-approval', { name: 'Separate approval for the exact change', captions: ['A fresh model review examines the result. A different organization member approves the exact candidate. Changed evidence or code requires a new approval.'] }),
  existing('09-pr', { name: 'An actual draft pull request', captions: ['The GitHub App creates this actual draft PR with its verification record. No automatic merge, deployment or physical-repair claim follows.'] }),
  existing('09b-private', { name: 'The separately verified private pilot', captions: ['A separate private pilot also completed, using encrypted transport and a pinned verifier in its own repository, with separate human approval.'] }),
  queue,
  existing('11-scope', { name: 'The investment gates remain visible', detail: 'Google login works.\nCompany email and managed SSO:\nexplicit next steps.\n200 capabilities: planned work.', captions: ['Google sign-in works. Company email, enforced SSO, shared inventory and broader language support remain investment gates. The two-hundred-capability map is planned work.'] }),
  existing('12-close', { name: 'Try it and inspect the evidence', detail: 'sparecycle-topaz.vercel.app\n\nSource, evidence and project dossier:\ngithub.com/Golden007-prog/sparecycle', label: 'Nebius · NVIDIA Nemotron · Tavily · Supabase · GitHub · Vercel', captions: ['Try the live app, inspect the draft and backend evidence, and download the project dossier. SpareCycle makes each next action reviewable.'] }),
];
const shorten = {
  '01-intro': ["SpareCycle joins a refurbishment coordinator's planning workflow with a diagnostics engineer's code review. Follow the working product, recorded backend proof, and the investment gates."],
  '02-journey': ['A technician records an observation. An engineer defines a supported software issue. A separate reviewer inspects the tested candidate. Every handoff keeps its evidence.'],
  '06-provider': ['Nebius Token Factory hosts inference. NVIDIA supplies Nemotron. GitHub Actions executes tests; Supabase protects organization records. These are distinct services, each with a defined job.'],
  '07-models': ['Nano and Lightning can investigate. Super writes and freshly reviews non-Ultra cases. Ultra is an explicit operator-enabled escalation, not an automatic promise of better quality.'],
  '08-usage': ['The supplied usage view records all four tiers. Its rounded cost buckets are provider evidence, not an exact invoice or comparative benchmark.'],
  '10-limits': ['A model stage has a forty-second deadline, a bounded context, strict output and reserved spend. There is no automatic paid retry after an uncertain result.'],
  '11-binding': ['Evidence revision, repository commit and candidate hashes travel together. Changed inputs require fresh verification and approval; a passing test cannot bless another patch.'],
  '15-private': ['The private pilot used Nano investigation and Super patching and review. Encrypted source went to a pinned verifier in the same private repository. Independent approval preceded the real draft.'],
  '16c-workshop': ['The Workshop allocates declared parts, time and budget. It stays browser-local; authenticated Review has separate organization records. Their handoff is explicit, without automatic inventory synchronization.'],
  '17-pilot': ['Start with one owned diagnostics project, one reproducible failure and a separate reviewer. A supervised pilot and usage-capped subscription are commercial hypotheses that still need buyer validation.'],
  '18-gaps': ['Google sign-in works. Company email is deferred; managed SSO requires enforcement and deprovisioning. Broader runners and physical repair outcomes need additional implementation and real field measurement.'],
  '19-investment': ['Fund reliable onboarding and supervised pilots first. Then failure recovery, usage reconciliation and evaluations. Enforced SSO, shared stock and broader runner profiles follow only after their acceptance gates.'],
  '20-measure': ['Measure accepted fixes, regressions, review time and total cost, including rejected attempts. The selected two hundred roadmap capabilities are planned work with acceptance criteria, not two hundred shipped features.'],
  '21-close': ['Inspect the live application, public draft, backend ledger, project dossier and roadmap. SpareCycle uses actual Nebius and NVIDIA inference to make the next action reviewable.'],
};
const deep = previousDeep.map(scene => ({ ...scene, ...(shorten[scene.id] ? { captions: shorten[scene.id] } : {}) }));
const expandedOperations = { ...operations, id: '02a-operations', name: 'Pilot Operations records the handoff', captions: [
  'Pilot Operations freezes the validated plan, then records per-device progress, blockers, assignment and due dates, actual effort, costs and evidence-backed manual checks.',
  'A local scorecard distinguishes proposed devices from technician-reported outcomes. Export a handoff or backup. These records neither consume shared stock nor certify a physical release.',
] };
const expandedResearch = { ...research, id: '02b-research', name: 'A real Tavily search, summarized on Nebius', captions: [
  'A public model question invokes Tavily in the application backend. The server filters official documentation, assigns source IDs, and passes only bounded snippets to NVIDIA Nemotron on Nebius.',
  'The result shows its sources, uncertainties and next checks. A matched citation is not a hardware diagnosis: the technician must inspect the source and the actual device.',
] };
const expandedQueue = { ...queue, id: '16d-review-queue', name: 'The reviewer attention queue', captions: [
  'Review insights compare loaded evidence revisions, verification references and approval bindings. Filters bring stale records, delayed jobs and cases requiring attention into one queue.',
  'This is read-only guidance. It does not rerun tests, validate repository head, change permissions, or execute a job. Refresh the server record before deciding.',
] };
deep.splice(2, 0, expandedOperations, expandedResearch);
deep.splice(deep.findIndex(scene => scene.id === '16-isolation'), 0, expandedQueue);
const gap = deep.find(scene => scene.id === '20-measure');
gap.note = '200 selected roadmap capabilities: planned, with acceptance gates. No fabricated shipped-feature count.';
deep.find(scene => scene.id === '21-close').label = 'Nebius Token Factory · NVIDIA Nemotron · Tavily · Supabase · GitHub · Vercel';
for (const [file, scenes] of [['storyboard.json', short], ['storyboard-deep-dive.json', deep]]) {
  if (new Set(scenes.map(scene => scene.id)).size !== scenes.length) throw new Error('Duplicate scene ID.');
  fs.writeFileSync(path.join(import.meta.dirname, file), JSON.stringify(scenes, null, 2) + '\n');
  console.log({ file, scenes: scenes.length, words: scenes.flatMap(scene => scene.captions).join(' ').split(/\s+/).length });
}
