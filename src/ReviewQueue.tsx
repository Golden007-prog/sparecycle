import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDownToLine, ChevronRight, Copy, FileCode2, Filter, Search, ShieldCheck, Wrench } from 'lucide-react';
import type { ChangeStatus, ModelTier, RecoveryChange, ReviewOverview } from '../lib/review/types';
import { changeInsights, createRedactedHandoff, exportRedactedAuditCsv, filterReviewChanges, summarizeReviewQueue } from '../lib/review/insights';
import { download } from './data-io';
import './review-queue.css';

const labels: Record<ChangeStatus, string> = { open: 'Ready to investigate', investigating: 'Investigating', needs_evidence: 'More evidence needed', hardware_review: 'Workshop review', patch_ready: 'Patch ready', testing: 'Testing', awaiting_approval: 'Awaiting approval', approved: 'Approved', published: 'Draft PR published', failed: 'Needs attention', cancelled: 'Cancelled' };
export function ReviewQueue({ overview, actorId, demo, compact = false, onSelect }: { overview: ReviewOverview; actorId?: string; demo: boolean; compact?: boolean; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState(''), [status, setStatus] = useState('all'), [project, setProject] = useState('all'), [model, setModel] = useState('all');
  const [mine, setMine] = useState(false), [attention, setAttention] = useState(false), [sort, setSort] = useState<'updated' | 'oldest'>('updated');
  const [now, setNow] = useState(Date.now()), [notice, setNotice] = useState(''), [error, setError] = useState('');
  const [preparedExport, setPreparedExport] = useState<{ name: string; text: string; mime: string } | null>(null);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  const summary = useMemo(() => summarizeReviewQueue(overview, { now }), [overview, now]);
  const changes = filterReviewChanges(overview, { query, statuses: status === 'all' ? undefined : [status as ChangeStatus], projectId: project === 'all' ? undefined : project === 'none' ? null : project, modelTiers: model === 'all' ? undefined : [model as ModelTier], mineOnly: mine, actorId, attentionOnly: attention, sort, now });
  const reset = () => { setQuery(''); setStatus('all'); setProject('all'); setModel('all'); setMine(false); setAttention(false); setSort('updated'); };
  const exportRecords = (kind: 'handoff' | 'audit') => {
    setError(''); setNotice('');
    try {
      const text = kind === 'handoff' ? JSON.stringify(createRedactedHandoff(overview, { confirmed: true, now: Date.now() }), null, 2) : exportRedactedAuditCsv(overview, { confirmed: true, now: Date.now() });
      setPreparedExport({ name: `sparecycle-${demo ? 'sample-' : ''}redacted-${kind}.${kind === 'handoff' ? 'json' : 'csv'}`, text, mime: kind === 'handoff' ? 'application/json' : 'text/csv;charset=utf-8' });
      setNotice('Preview prepared from the loaded organization records. Review it before sharing.');
    } catch { setError('The export could not be prepared. Refresh the organization records and try again.'); }
  };
  const copyExport = async () => {
    if (!preparedExport) return;
    try { await navigator.clipboard.writeText(preparedExport.text); setError(''); setNotice('Redacted export copied.'); }
    catch { setError('Clipboard access is unavailable. Select and copy the preview below.'); }
  };
  const saveExport = () => {
    if (!preparedExport) return;
    try { download(preparedExport.name, preparedExport.text, preparedExport.mime); setError(''); setNotice('File save requested. If no file appears, copy the preview below.'); }
    catch { setError('The file could not be saved. Select and copy the preview below.'); }
  };
  return <section className="rv-panel rq-panel" aria-label="Review queue">
    <div className="rv-panel-head"><div><h2>{compact ? 'On your review bench' : 'A clear view of the next decision'}</h2><p>{demo ? 'Illustrative cases; no jobs were executed for this sample.' : 'Find the change, check its evidence and continue the server-controlled workflow.'}</p></div><span className="rv-chip">{summary.total} loaded</span></div>
    {!compact && <><div className="rq-scorecard" aria-label="Loaded queue summary">
      <button type="button" onClick={() => { reset(); setAttention(true); }}><span>Needs attention</span><strong>{summary.attention}</strong><small>Missing or inconsistent records</small></button>
      <button type="button" onClick={() => { reset(); setStatus('awaiting_approval'); }}><span>Awaiting approval</span><strong>{summary.awaitingApproval}</strong><small>Inspect the tested candidate</small></button>
      <button type="button" onClick={() => { reset(); setStatus('published'); }}><span>Published drafts</span><strong>{summary.publishedDrafts}</strong><small>Repository review still required</small></button>
      <div><span>Active jobs</span><strong>{summary.activeJobs}</strong><small>{summary.delayedJobs} without a recent update</small></div>
    </div><p className="rq-scope">Counts cover loaded records only. They are not a complete organization report or a fresh test execution.</p></>}
    <div className="rq-filters">
      <label className="rq-search"><Search size={15}/><span className="rv-sr-only">Search change requests</span><input value={query} onChange={event => setQuery(event.target.value)} maxLength={200} placeholder="Search title, laptop or project…"/></label>
      <label><span>Status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {!compact && <><label><span>Project</span><select value={project} onChange={event => setProject(event.target.value)}><option value="all">All projects</option><option value="none">Laptop evidence only</option>{overview.projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Model route</span><select value={model} onChange={event => setModel(event.target.value)}><option value="all">All Nemotron tiers</option>{(['nano', 'lightning', 'super', 'ultra'] as const).map(tier => <option key={tier} value={tier}>{tier[0].toUpperCase() + tier.slice(1)}</option>)}</select></label><label><span>Order</span><select value={sort} onChange={event => setSort(event.target.value as 'updated' | 'oldest')}><option value="updated">Recently updated</option><option value="oldest">Oldest first</option></select></label></>}
    </div>
    <div className="rq-toggles"><label><input type="checkbox" checked={attention} onChange={event => setAttention(event.target.checked)}/>Needs attention</label>{!compact && <label><input type="checkbox" checked={mine} disabled={!actorId || demo} onChange={event => setMine(event.target.checked)}/>Requested by me</label>}<button type="button" className="rv-button ghost small" onClick={reset}><Filter size={13}/>Clear filters</button><span role="status">{changes.length} matching</span></div>
    {changes.length ? changes.slice(0, compact ? 5 : 200).map(change => {
      const laptop = overview.laptops.find(item => item.id === change.laptopId), insight = changeInsights(change, overview, { now });
      return <button key={change.id} type="button" className="rv-review-row" onClick={() => onSelect(change.id)}><span className={`rv-review-icon ${!change.projectId ? 'hardware' : ''}`}>{change.projectId ? <FileCode2 size={17}/> : <Wrench size={17}/>}</span><div className="rv-review-row-content"><div className="rv-row-top"><small>{change.id.startsWith('sample-') ? change.id.replace('sample-', '').toUpperCase() : `RCR ${change.id.slice(0, 8)}`}</small><span className={`rv-chip ${['published', 'approved'].includes(change.status) ? 'green' : 'blue'}`}>{labels[change.status]}</span></div><h3>{change.title}</h3><p>{laptop?.assetTag ?? 'Laptop'}<span>/</span>Evidence rev. {change.evidenceVersion}<span>/</span>Nemotron {change.modelTier}</p>{insight.needsAttention && <span className="rq-warning"><AlertCircle size={12}/>{insight.warnings[0].message}</span>}</div><ChevronRight size={16} className="rv-row-arrow"/></button>;
    }) : <div className="rv-empty"><Search size={27}/><h3>No matching requests</h3><p>Clear filters or create a request from an observed laptop problem.</p></div>}
    {!compact && <details className="rq-exports"><summary>Export a redacted review handoff</summary><p>Exports include workflow states, counts and timestamps from loaded records. Local aliases replace identifiers. Evidence text, code, repository names, paths, URLs, hashes and credentials are omitted. This is a limited handoff, not a full backup.</p><div className="rv-actions"><button type="button" className="rv-button secondary small" onClick={() => exportRecords('handoff')}>Preview redacted JSON</button><button type="button" className="rv-button secondary small" onClick={() => exportRecords('audit')}>Preview redacted activity CSV</button></div>{preparedExport && <div className="rq-export-preview"><label htmlFor="review-export-preview">{preparedExport.name}</label><textarea id="review-export-preview" value={preparedExport.text} readOnly spellCheck={false} rows={10}/><div className="rv-actions"><button type="button" className="rv-button secondary small" onClick={() => void copyExport()}><Copy size={14}/>Copy export</button><button type="button" className="rv-button secondary small" onClick={saveExport}><ArrowDownToLine size={14}/>Save file</button></div></div>}{notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}</details>}
  </section>;
}

export function ReviewIntegrityPanel({ change, overview }: { change: RecoveryChange; overview: ReviewOverview }) {
  const check = changeInsights(change, overview);
  return <section className="rv-panel rq-integrity"><div className="rv-panel-head"><h2><ShieldCheck size={17}/>Recorded evidence checks</h2></div><div className="rv-panel-body"><dl className="rq-checks">
    <div><dt>Passport revision</dt><dd>{check.evidence.state === 'current' ? 'Matches this request' : check.evidence.state === 'stale' ? 'Different revision' : 'Unavailable'}</dd></div>
    <div><dt>Test references</dt><dd>{check.verification.binding}</dd></div>
    <div><dt>Baseline / candidate</dt><dd>{check.verification.recordedPassed ? 'Failure / success recorded' : 'Proof not established'}</dd></div>
    <div><dt>Approval references</dt><dd>{check.approval.binding}</dd></div>
    <div><dt>Separate approver</dt><dd>{check.approval.independentActor === null ? 'Not established' : check.approval.independentActor ? 'Different account recorded' : 'Same account — inspect'}</dd></div>
  </dl>{check.warnings.length > 0 && <ul className="rq-check-warnings">{check.warnings.map(warning => <li key={warning.code}>{warning.message}</li>)}</ul>}<p className="rv-small-print">{check.limitation}</p></div></section>;
}
