import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, BookOpen, Check, ChevronRight, Clipboard, FileSearch, Globe2, Info, LoaderCircle, Search, ShieldCheck } from 'lucide-react';
import type { ResearchResult } from '../lib/research';
import './research.css';

export interface ResearchHealth {
  aiConfigured: boolean;
  tavilyConfigured?: boolean;
  tavilyMode?: 'keyless' | 'api-key' | 'unconfigured';
}
type ResearchResponse = {
  data: ResearchResult;
  meta: { provider: 'Nebius Token Factory'; model: string; latencyMs: number; tools?: { name: string; status: string; resultCount: number }[] };
};
const examples = [
  { label: 'Maintenance manual', model: 'Lenovo ThinkPad T480', question: 'Where is the official hardware maintenance manual for this exact model? Identify matching documents and scope limitations only.' },
  { label: 'Power references', model: 'Dell Latitude 5490', question: 'Find the official power and battery reference documents for this exact model. Identify their scope and model limitations, without repair steps.' },
  { label: 'Memory specifications', model: 'HP EliteBook 840 G5', question: 'Find official memory specification documents for this exact model and generation. Identify references and any uncertainty, without installation steps.' },
];

function sourceUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2_000) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const boundedText = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max;
const textList = (value: unknown, max: number): value is string[] => Array.isArray(value) && value.length <= 20 && value.every(item => boundedText(item, max));

/** Reject malformed results rather than display unbound citations or unsafe links. */
function readResearch(value: unknown, expected: { model: string; question: string }): ResearchResponse | null {
  if (!object(value) || !object(value.data) || !object(value.meta)) return null;
  const data = value.data, meta = value.meta;
  if (data.kind !== 'research' || data.model !== expected.model || data.question !== expected.question || !boundedText(data.summary, 8_000)) return null;
  if (!boundedText(data.fetchedAt, 80) || !Number.isFinite(Date.parse(data.fetchedAt)) || !textList(data.uncertainties, 2_000) || !textList(data.nextChecks, 2_000)) return null;
  if (!Array.isArray(data.sources) || data.sources.length > 10 || !Array.isArray(data.findings) || data.findings.length > 20) return null;
  const ids = new Set<string>();
  for (const source of data.sources) {
    if (!object(source) || !boundedText(source.id, 40) || ids.has(source.id) || !boundedText(source.title, 500) || !sourceUrl(source.url) || typeof source.excerpt !== 'string' || source.excerpt.length > 8_000) return null;
    ids.add(source.id);
  }
  if (!data.findings.every(finding => object(finding) && boundedText(finding.text, 4_000) && textList(finding.sourceIds, 40) && finding.sourceIds.length > 0 && finding.sourceIds.every(id => ids.has(id)))) return null;
  if (!object(data.search) || data.search.provider !== 'Tavily' || !['keyless', 'api-key'].includes(String(data.search.mode)) || !Number.isSafeInteger(data.search.resultCount) || data.search.resultCount !== data.sources.length) return null;
  if (meta.provider !== 'Nebius Token Factory' || !boundedText(meta.model, 200) || typeof meta.latencyMs !== 'number' || !Number.isFinite(meta.latencyMs) || meta.latencyMs < 0) return null;
  return value as unknown as ResearchResponse;
}

function evidenceBrief(result: ResearchResponse): string {
  const data = result.data;
  return [
    'SpareCycle — unreviewed research brief',
    'Requires technician verification. Not compatibility approval, a diagnosis, or permission to perform a repair.',
    `Model: ${data.model}`, `Question: ${data.question}`, `Retrieved: ${data.fetchedAt}`,
    `Search: Tavily | Synthesis: ${data.sources.length ? `Nebius Token Factory (${result.meta.model})` : 'Not run — no usable sources returned'}`, '', data.summary, '', 'Findings',
    ...data.findings.map(finding => `- ${finding.text} [${finding.sourceIds.join(', ')}]`), '', 'Uncertainties',
    ...data.uncertainties.map(text => `- ${text}`), '', 'Checks for a technician', ...data.nextChecks.map(text => `- ${text}`), '', 'Sources',
    ...data.sources.flatMap(source => [`[${source.id}] ${source.title}`, sourceUrl(source.url)!, source.excerpt, '']),
    'Copied for manual review. No inventory record, compatibility decision, or Review approval was changed.',
  ].join('\n');
}

function requestError(code: unknown, status: number): string {
  if (status === 429) return 'The research request limit has been reached. Please wait before trying again; no new brief was created.';
  if (status === 503 || code === 'AI_NOT_CONFIGURED' || code === 'TAVILY_NOT_CONFIGURED') return 'Live research is not available on this deployment yet. Try again after the search and AI connections are ready.';
  if (status === 400) return 'Check the public model name and question. Leave out serial numbers, private records and repository code.';
  if (status === 504) return 'Research took too long to finish. No brief was accepted. Try a more focused question when the service is available.';
  return 'The research service could not complete this request. No brief was accepted. Please try again later.';
}

export default function ResearchDesk({ health }: { health: ResearchHealth | null }) {
  const [model, setModel] = useState(examples[0].model);
  const [question, setQuestion] = useState(examples[0].question);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [copied, setCopied] = useState(false), [copyFallback, setCopyFallback] = useState(false);
  const [copyError, setCopyError] = useState('');
  const active = useRef<AbortController | null>(null), briefRef = useRef<HTMLTextAreaElement>(null);
  const copyVersion = useRef(0);
  useEffect(() => () => { active.current?.abort(); active.current = null; copyVersion.current++; }, []);
  const unavailable = health?.aiConfigured === false || health?.tavilyConfigured === false;
  const valid = model.trim().length >= 2 && model.trim().length <= 100 && question.trim().length >= 10 && question.trim().length <= 280 && model.trim().length + question.trim().length < 400;
  const clearResult = () => { setResult(null); setError(''); setCopied(false); setCopyFallback(false); setCopyError(''); copyVersion.current++; };
  async function research(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active.current || !valid || unavailable) return;
    const request = { model: model.trim(), question: question.trim() };
    const controller = new AbortController(); active.current = controller;
    clearResult(); setBusy(true);
    const timer = window.setTimeout(() => controller.abort(), 75_000);
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'research', ...request }), signal: controller.signal });
      const raw = await response.text();
      if (raw.length > 100_000) throw new Error('The research response was too large to verify. No brief was accepted.');
      let body: unknown;
      try { body = JSON.parse(raw); } catch { throw new Error('The research service returned an unreadable response. Please try again later.'); }
      if (!response.ok) throw new Error(requestError(object(body) ? body.code : undefined, response.status));
      const parsed = readResearch(body, request);
      if (!parsed) throw new Error('The research response could not be verified. No brief was accepted. Please try again later.');
      if (active.current === controller) setResult(parsed);
    } catch (failure) {
      if (active.current !== controller) return;
      setError(controller.signal.aborted ? 'The wait ended before a complete brief arrived. Work already sent to providers may still finish. Please wait before retrying.' : failure instanceof TypeError ? 'The connection ended before research finished. Check your connection and try again later.' : failure instanceof Error ? failure.message : 'Research could not finish. Please try again later.');
    } finally {
      window.clearTimeout(timer);
      if (active.current === controller) { active.current = null; setBusy(false); }
    }
  }
  async function copyBrief() {
    if (!result) return;
    const version = copyVersion.current;
    setCopied(false); setCopyError('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(evidenceBrief(result));
      if (version === copyVersion.current) { setCopied(true); setCopyFallback(false); }
    } catch {
      if (version !== copyVersion.current) return;
      setCopyError('Clipboard access is unavailable. Select and copy the brief below.'); setCopyFallback(true);
      requestAnimationFrame(() => { briefRef.current?.focus(); briefRef.current?.select(); });
    }
  }
  const sources = result?.data.sources ?? [];
  return <div className="rd-desk">
    <div className="rd-intro"><span className="rd-intro-icon"><BookOpen size={24} strokeWidth={1.6}/></span><p>Find the manufacturer reference behind your next decision. Ask about a public laptop model; keep the findings connected to their sources.</p><a className="rd-review-link" href="/review">Open Review<ArrowUpRight size={15}/></a></div>
    <div className="rd-layout">
      <section className="rd-question-panel" aria-labelledby="research-question-title">
        <div className="rd-panel-heading"><Search size={20}/><h2 id="research-question-title">What needs a closer look?</h2></div>
        <form onSubmit={event => void research(event)}>
          <label htmlFor="research-model">Public model name</label>
          <input id="research-model" autoComplete="off" maxLength={100} minLength={2} required value={model} disabled={busy} onChange={event => { setModel(event.target.value); clearResult(); }} placeholder="e.g. Lenovo ThinkPad T480" aria-describedby="research-model-help research-privacy"/>
          <p id="research-model-help" className="rd-field-help">Include the exact model number, such as T480 or Latitude 5490. A product family or year alone may not return a usable reference.</p>
          <div className="rd-label-line"><label htmlFor="research-question">Your question</label><span aria-hidden="true">{question.length}/280</span></div>
          <textarea id="research-question" rows={5} maxLength={280} minLength={10} required value={question} disabled={busy} onChange={event => { setQuestion(event.target.value); clearResult(); }} aria-describedby="research-privacy"/>
          <p id="research-privacy" className="rd-field-help">Your model and question go to Tavily; Nebius reads them with the returned public sources. Leave out serial numbers, personal details, private logs and code.</p>
          {unavailable && <div className="rd-message" role="status"><Info size={17}/><p>Live research is awaiting its search or AI connection. You can prepare a question here.</p></div>}
          {error && <div className="rd-message rd-error" role="alert"><Info size={17}/><p>{error}</p></div>}
          <button className="rd-submit" type="submit" disabled={busy || !valid || unavailable}>{busy ? <LoaderCircle size={17} className="rd-spinner"/> : <FileSearch size={18}/>}<span>{busy ? 'Researching sources…' : 'Research this question'}</span>{!busy && <ChevronRight size={16}/>}</button>
          <p className="rd-request-note">Runs only when you ask. Prototype availability limits apply.</p>
        </form>
        <div className="rd-examples"><h3>Start with an example</h3><p>Choose a question, then run the research.</p>{examples.map(example => <button key={example.model} type="button" disabled={busy} onClick={() => { setModel(example.model); setQuestion(example.question); clearResult(); }}><span><strong>{example.label}</strong><small>{example.model}</small></span><ChevronRight size={15}/></button>)}</div>
      </section>
      <section className="rd-brief" aria-labelledby="research-brief-title" aria-busy={busy}>
        <div className="rd-brief-header"><div><span className="rd-sheet-mark"><FileSearch size={16}/></span><h2 id="research-brief-title">The evidence brief</h2></div><span className="rd-reference-tag">Reference only</span></div>
        <div className="rd-provider-strip"><span><Globe2 size={14}/>Tavily search</span><span><span className="rd-provider-dot"/>{result && !sources.length ? 'AI synthesis skipped: no sources' : 'Nebius + NVIDIA Nemotron'}</span></div>
        <p className="rd-status" role="status" aria-live="polite">{busy ? 'Searching official references and preparing a cited brief. This can take about a minute.' : result ? `${sources.length} ${sources.length === 1 ? 'source' : 'sources'} returned. Review the findings and uncertainties below.` : 'Your next request will appear here.'}</p>
        {busy ? <div className="rd-loading"><div className="rd-loading-icon"><FileSearch size={38} strokeWidth={1.3}/></div><h3>Following the sources.</h3><p>The brief will keep what is supported, what is uncertain, and what a technician still needs to check.</p><span className="rd-loading-line"/></div> : result ? <div className="rd-result">
          <div className="rd-result-heading"><div><span>{result.data.model}</span><h3>{result.data.question}</h3></div><button type="button" className="rd-copy" onClick={() => void copyBrief()}>{copied ? <Check size={15}/> : <Clipboard size={15}/>}<span>{copied ? 'Brief copied' : 'Copy brief'}</span></button></div>
          <p className="rd-retrieved">Retrieved <time dateTime={result.data.fetchedAt}>{new Date(result.data.fetchedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time></p>
          <p className="rd-summary">{result.data.summary}</p>
          {!!result.data.findings.length && <section className="rd-findings" aria-labelledby="research-findings"><h3 id="research-findings">What the references support</h3>{result.data.findings.map((finding, index) => <article key={index}><p>{finding.text}</p><div className="rd-citations">{[...new Set(finding.sourceIds)].map(id => { const source = sources.find(item => item.id === id)!; return <a key={id} href={sourceUrl(source.url)!} target="_blank" rel="noopener noreferrer" aria-label={`Source ${sources.indexOf(source) + 1}: ${source.title} (opens in a new tab)`}><BookOpen size={12}/>Source {sources.indexOf(source) + 1}<ArrowUpRight size={12}/></a>; })}</div></article>)}</section>}
          {!!result.data.uncertainties.length && <section className="rd-uncertainties"><h3><Info size={16}/>What remains uncertain</h3><ul>{result.data.uncertainties.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
          {!!result.data.nextChecks.length && <section className="rd-next-checks"><h3>Checks for a technician</h3><ol>{result.data.nextChecks.map((item, index) => <li key={index}>{item}</li>)}</ol></section>}
          <section className="rd-sources" aria-labelledby="research-sources"><div><h3 id="research-sources">Open the original references</h3><span>{sources.length}</span></div>{!!sources.length && <p className="rd-source-note">Excerpts are search snippets. Open each source and verify it against the exact device.</p>}{sources.length ? sources.map((source, index) => <article key={source.id}><span className="rd-source-number">{index + 1}</span><div><a href={sourceUrl(source.url)!} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={14}/></a><small>{new URL(source.url).hostname}</small>{source.excerpt && <details><summary>Read source excerpt</summary><p>{source.excerpt}</p></details>}</div></article>) : <p className="rd-no-sources">No suitable source was returned. Add a more precise model name or question; absence of a result does not establish compatibility.</p>}</section>
          <details className="rd-run-details"><summary>About this research request</summary><dl><div><dt>Search provider</dt><dd>Tavily</dd></div><div><dt>AI synthesis</dt><dd>{sources.length ? result.meta.provider : 'Not run — no usable sources'}</dd></div><div><dt>{sources.length ? 'Model used' : 'Configured model'}</dt><dd>{result.meta.model}</dd></div><div><dt>Search access</dt><dd>{result.data.search.mode === 'keyless' ? 'Keyless prototype access' : 'Configured API access'}</dd></div></dl><p>Request limits apply per server instance. They are not a durable company quota. The result stays in this page until you leave or change the question.</p></details>
          <div className="rd-copy-status" role="status" aria-live="polite">{copied ? 'Copied with sources and retrieval time. Review it before adding it to a case.' : copyError}</div>
          {copyFallback && <label className="rd-copy-fallback">Research brief to copy<textarea ref={briefRef} readOnly rows={10} value={evidenceBrief(result)}/></label>}
        </div> : <div className="rd-empty"><div className="rd-empty-illustration" aria-hidden="true"><div className="rd-document"><BookOpen size={28} strokeWidth={1.25}/><span/><span/><span/></div><span className="rd-document-search"><Search size={24} strokeWidth={1.5}/></span></div><h3>A useful answer keeps its sources.</h3><p>Ask one focused question. Get a short brief with cited findings, open questions and the next checks to make at the bench.</p><div className="rd-empty-steps"><span><Globe2 size={17}/>Find references</span><span><BookOpen size={17}/>Read the evidence</span><span><ShieldCheck size={17}/>Verify on the device</span></div></div>}
        <div className="rd-boundary"><ShieldCheck size={18}/><p>Research informs a review. It does not approve a replacement part, diagnose a device, or authorize a repair. No inventory or Review approval is changed.</p></div>
      </section>
    </div>
  </div>;
}
