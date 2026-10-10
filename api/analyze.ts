import type { HttpRequest, HttpResponse } from '../lib/http.js';
import { AnalysisError, analysisRequestSchema, MAX_BODY_BYTES, runAnalysis } from '../lib/ai.js';
import type { AnalysisInput, AnalysisResponse, Environment } from '../lib/ai.js';

interface Window { count: number; expires: number }

// Defense in depth for the demo: these counters are process-local, reset on
// restarts, and do not coordinate across serverless instances. A production
// service needs authenticated quotas and a durable shared rate-limit store.
export class RequestLimiter {
  private readonly clients = new Map<string, Window>();
  private global: Window = { count: 0, expires: 0 };
  private readonly active = new Set<string>();
  constructor(private readonly now: () => number = Date.now) {}

  acquire(key: string): (() => void) | null {
    const now = this.now();
    for (const [ip, bucket] of this.clients) if (bucket.expires <= now) this.clients.delete(ip);
    if (this.global.expires <= now) this.global = { count: 0, expires: now + 3_600_000 };
    let bucket = this.clients.get(key);
    if (!bucket) {
      if (this.clients.size >= 1_000) return null;
      bucket = { count: 0, expires: now + 600_000 };
    }
    if (bucket.count >= 5 || this.global.count >= 60 || this.active.size >= 2 || this.active.has(key)) return null;
    bucket.count += 1;
    this.global.count += 1;
    this.clients.set(key, bucket);
    this.active.add(key);
    return () => { this.active.delete(key); };
  }
}

function requestIp(req: HttpRequest): string {
  // Vercel overwrites this header. The local server uses the actual socket
  // address so a caller cannot bypass its limiter with a forwarded header.
  const forwarded = process.env.VERCEL ? req.headers['x-forwarded-for'] : undefined;
  const value = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  return (value || req.socket?.remoteAddress || 'unknown').slice(0, 100);
}

function allowedOrigin(req: HttpRequest, env: Environment): boolean {
  const origin = req.headers.origin;
  if (!origin) return true; // Same-origin CLI/API clients do not send Origin.
  if (typeof origin !== 'string' || origin === 'null') return false;
  try {
    const parsed = new URL(origin);
    if (!['https:', 'http:'].includes(parsed.protocol)) return false;
    if (env.APP_ORIGIN) return parsed.origin === new URL(env.APP_ORIGIN).origin;
    return parsed.host === req.headers.host;
  } catch { return false; }
}

interface HandlerOptions {
  limiter?: RequestLimiter;
  env?: Environment;
  invoke?: (input: AnalysisInput) => Promise<AnalysisResponse>;
}

export function createAnalyzeHandler(options: HandlerOptions = {}) {
  const limiter = options.limiter ?? new RequestLimiter();
  return async (req: HttpRequest, res: HttpResponse) => {
    const env = options.env ?? process.env;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Use POST for this endpoint.', code: 'METHOD_NOT_ALLOWED' });
    }
    if (!allowedOrigin(req, env)) return res.status(403).json({ error: 'This request origin is not allowed.', code: 'ORIGIN_NOT_ALLOWED' });
    if (!req.headers['content-type']?.includes('application/json')) {
      return res.status(400).json({ error: 'Send a JSON request body.', code: 'INVALID_INPUT' });
    }
    let body: unknown;
    try {
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) throw new Error('Body limit');
      body = typeof req.body === 'string' ? JSON.parse(raw) : req.body;
    } catch {
      return res.status(400).json({ error: 'Provide a valid JSON body under 24 KB.', code: 'INVALID_INPUT' });
    }
    const parsed = analysisRequestSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: 'Provide an intake message (10–6,000 characters) or a bounded recovery batch and limits.', code: 'INVALID_INPUT' });
    if (!env.NEBIUS_API_KEY?.trim()) return res.status(503).json({ error: 'Live AI is not configured. You can continue with the local recovery planner.', code: 'AI_NOT_CONFIGURED' });
    const release = limiter.acquire(requestIp(req));
    if (!release) {
      res.setHeader('Retry-After', '600');
      return res.status(429).json({ error: 'The live AI request limit has been reached. Please wait or continue manually.', code: 'RATE_LIMITED' });
    }
    try {
      const result = await (options.invoke ?? ((input) => runAnalysis(input, { env })))(parsed.data);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof AnalysisError) return res.status(error.status).json({ error: error.message, code: error.code });
      return res.status(502).json({ error: 'Live AI is temporarily unavailable. Please try again or continue manually.', code: 'AI_UNAVAILABLE' });
    } finally { release(); }
  };
}

export default createAnalyzeHandler();
