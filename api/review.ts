import { randomUUID } from 'node:crypto';
import type { HttpRequest, HttpResponse } from '../lib/http.js';
import { authenticateReviewRequest, reviewAuthConfig, ReviewAccessError, type ReviewEnvironment } from '../lib/review/auth.js';
import { ReviewEngineError } from '../lib/review/github.js';
import { REVIEW_MODELS } from '../lib/review/harness.js';
import { REVIEW_MAX_BODY_BYTES, reviewActionSchema } from '../lib/review/request.js';
import { ReviewStoreError } from '../lib/review/store.js';
import type { ModelTier, ReviewAction, ReviewConfig } from '../lib/review/types.js';

export type ReviewAuthentication = Awaited<ReturnType<typeof authenticateReviewRequest>>;
export interface ReviewHandlerOptions {
  env?: ReviewEnvironment;
  authenticate?: (authorization: string | undefined, env: ReviewEnvironment) => Promise<ReviewAuthentication>;
  invoke?: (action: ReviewAction, auth: ReviewAuthentication, env: ReviewEnvironment) => Promise<unknown>;
}
function singleHeader(value: string | string[] | undefined): string | undefined { return typeof value === 'string' ? value : undefined; }
function allowedOrigin(req: HttpRequest, env: ReviewEnvironment): boolean {
  const value = req.headers.origin;
  if (value === undefined) return req.headers['sec-fetch-site'] !== 'cross-site';
  if (typeof value !== 'string' || value === 'null') return false;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.origin !== value) return false;
    if (env.APP_ORIGIN) return url.origin === new URL(env.APP_ORIGIN).origin;
    return url.host === req.headers.host;
  } catch { return false; }
}
function installUrl(env: ReviewEnvironment): string | null {
  if (env.GITHUB_APP_INSTALL_URL) {
    try { const url = new URL(env.GITHUB_APP_INSTALL_URL); if (url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && !url.search && !url.hash && /^\/apps\/[A-Za-z0-9-]+\/installations\/new\/?$/.test(url.pathname)) return url.toString(); } catch { /* Invalid public configuration is not exposed. */ }
  }
  return env.GITHUB_APP_SLUG && /^[a-z0-9-]+$/.test(env.GITHUB_APP_SLUG) ? `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new` : null;
}
export function publicReviewConfig(env: ReviewEnvironment): ReviewConfig {
  const auth = reviewAuthConfig(env);
  return {
    version: '2', authConfigured: !!auth, supabaseUrl: auth?.url ?? null, supabasePublishableKey: auth?.publishableKey ?? null,
    githubConfigured: !!env.GITHUB_APP_ID?.trim() && !!env.GITHUB_APP_PRIVATE_KEY?.trim(), githubInstallUrl: installUrl(env),
    nebiusConfigured: !!env.NEBIUS_API_KEY?.trim(),
    sandboxConfigured: !!env.NEBIUS_API_KEY?.trim() && !!env.NEBIUS_PROJECT_ID?.trim() && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(env.NEBIUS_SANDBOX_IMAGE_ID ?? ''),
    runnerConfigured: ['REVIEW_ACTIONS_REPOSITORY', 'REVIEW_ACTIONS_REPOSITORY_ID', 'REVIEW_ACTIONS_INSTALLATION_ID', 'REVIEW_ACTIONS_REF', 'REVIEW_ACTIONS_SHA', 'REVIEW_ACTIONS_IMAGE', 'GITHUB_APP_ID', 'GITHUB_APP_PRIVATE_KEY'].every(key => !!env[key]?.trim()),
    models: (Object.entries(REVIEW_MODELS) as Array<[ModelTier, (typeof REVIEW_MODELS)[ModelTier]]>).filter(([tier]) => tier !== 'ultra' || env.NEBIUS_REVIEW_ALLOW_ULTRA === 'true').map(([tier, model]) => ({ tier, id: model.id, label: model.label })),
    limitations: ['The initial verification profile supports a bounded JavaScript diagnostics module and existing Node tests.', 'Configuration flags are not live connectivity or successful test claims.', 'Organization activity is an audit record, not a security certification.', 'Physical repair outcomes need technician verification. A draft pull request does not certify a laptop.'],
  };
}

export function createReviewHandler(options: ReviewHandlerOptions = {}) {
  return async (req: HttpRequest, res: HttpResponse) => {
    const env = options.env ?? process.env;
    const requestId = randomUUID();
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Vary', 'Origin, Authorization');
    res.setHeader('X-Request-Id', requestId);
    const fail = (status: number, code: string, error: string) => res.status(status).json({ error, code, requestId });
    if (req.method === 'GET') return res.status(200).json(publicReviewConfig(env));
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return fail(405, 'METHOD_NOT_ALLOWED', 'Use GET for configuration or POST for an authenticated action.'); }
    if (!allowedOrigin(req, env)) return fail(403, 'ORIGIN_NOT_ALLOWED', 'This request origin is not allowed.');
    const type = singleHeader(req.headers['content-type']);
    if (!type || !/^application\/json(?:\s*;\s*charset\s*=\s*utf-8)?\s*$/i.test(type)) return fail(400, 'INVALID_INPUT', 'Send an application/json request body.');
    let body: unknown;
    try {
      const length = singleHeader(req.headers['content-length']);
      if (length && (!/^\d+$/.test(length) || Number(length) > REVIEW_MAX_BODY_BYTES)) throw new Error('Body limit');
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!raw || Buffer.byteLength(raw, 'utf8') > REVIEW_MAX_BODY_BYTES) throw new Error('Body limit');
      body = typeof req.body === 'string' ? JSON.parse(raw) : req.body;
    } catch { return fail(400, 'INVALID_INPUT', 'Provide a valid JSON body under 32 KB.'); }
    const parsed = reviewActionSchema.safeParse(body);
    if (!parsed.success) return fail(400, 'INVALID_INPUT', 'The action contains an invalid, unexpected or oversized value. Check the selected record and supported diagnostics paths.');
    try {
      const auth = await (options.authenticate ?? authenticateReviewRequest)(singleHeader(req.headers.authorization), env);
      const invoke = options.invoke ?? (async (action: ReviewAction, context: ReviewAuthentication, environment: ReviewEnvironment) => {
        const { executeReviewAction } = await import('../lib/review/service.js');
        return executeReviewAction(action, context, environment);
      });
      const data = await invoke(parsed.data, auth, env);
      return res.status(200).json({ data, requestId });
    } catch (error) {
      if (error instanceof ReviewAccessError || error instanceof ReviewStoreError || error instanceof ReviewEngineError) {
        if (error.status === 429) res.setHeader('Retry-After', '60');
        return fail(error.status, error.code, error.message);
      }
      return fail(500, 'REVIEW_UNAVAILABLE', 'This review action could not be completed. Refresh the record before trying again.');
    }
  };
}

export default createReviewHandler();
