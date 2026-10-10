import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

const Workshop = lazy(() => import('./App'));
const Marketing = lazy(() => import('./Marketing'));
const page = window.location.pathname.replace(/\/$/, '') || '/';
const titles: Record<string, string> = {
  '/': 'SpareCycle — More laptops. More second lives.',
  '/app': 'SpareCycle Workshop — Plan a second life',
  '/how-it-works': 'How SpareCycle works — Evidence to repair plan',
  '/for-teams': 'SpareCycle for teams — Start a workshop pilot',
  '/data': 'SpareCycle data — Sources, quality and limits',
};
document.title = titles[page] ?? 'Page not found — SpareCycle';
const fallback = <main style={{ fontFamily: 'system-ui', maxWidth: 600, margin: '20vh auto', padding: 24 }} aria-live="polite">Opening SpareCycle…</main>;
const missing = <main style={{ fontFamily: 'system-ui', maxWidth: 600, margin: '20vh auto', padding: 24 }}><h1>This page is not on the bench.</h1><p><a href="/">Go to SpareCycle</a> or <a href="/app">open the workshop</a>.</p></main>;
createRoot(document.getElementById('root')!).render(<React.StrictMode><Suspense fallback={fallback}>{page === '/app' ? <Workshop/> : titles[page] ? <Marketing page={page}/> : missing}</Suspense></React.StrictMode>);
