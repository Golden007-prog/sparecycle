import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import analyze from '../api/analyze.js';
import health from '../api/health.js';
import { MAX_BODY_BYTES } from '../lib/ai.js';

const envFile = resolve('.env.local');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const app = express();
app.disable('x-powered-by');
app.use('/api', express.json({ limit: MAX_BODY_BYTES, strict: true }));
app.all('/api/health', (req, res) => health(req, res));
app.all('/api/analyze', (req, res) => analyze(req, res));
app.use('/api', (_req, res) => { res.status(404).json({ error: 'API endpoint not found.', code: 'NOT_FOUND' }); });
app.use(((error, _req, res, next) => {
  if (error instanceof SyntaxError || (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large')) {
    res.status(400).json({ error: 'Provide a valid JSON body under 24 KB.', code: 'INVALID_INPUT' });
    return;
  }
  next(error);
}) as express.ErrorRequestHandler);

const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
app.use(vite.middlewares);
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, '0.0.0.0', () => { console.log(`SpareCycle is ready at http://localhost:${port}`); });
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { server.close(); void vite.close().finally(() => process.exit(0)); });
}
