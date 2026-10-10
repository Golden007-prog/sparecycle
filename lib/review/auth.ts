import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export class ReviewAccessError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = 'ReviewAccessError';
  }
}

export type ReviewEnvironment = Record<string, string | undefined>;
export type ReviewClientFactory = typeof createClient;
export interface ReviewTransportOptions { fetch?: typeof fetch; timeoutMs?: number }

/** One deadline covers connection, headers and body; callers can only lower it. */
export function createReviewFetch(transport: typeof fetch = globalThis.fetch, timeoutMs = 8_000): typeof fetch {
  const timeout = Number.isFinite(timeoutMs) ? Math.max(1, Math.min(timeoutMs, 8_000)) : 8_000;
  return async (input, init) => {
    const deadline = new AbortController();
    const signals = [deadline.signal];
    if (init?.signal) signals.push(init.signal);
    if (input instanceof Request) signals.push(input.signal);
    const signal = AbortSignal.any(signals);
    let onAbort: (() => void) | undefined;
    const aborted = new Promise<never>((_resolve, reject) => {
      onAbort = () => reject(signal.reason);
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
    const timer = setTimeout(() => deadline.abort(new DOMException('The review database request timed out.', 'TimeoutError')), timeout);
    try {
      return await Promise.race([aborted, (async () => {
        signal.throwIfAborted();
        const response = await transport(input, { ...init, signal });
        // Supabase reads JSON/text after fetch resolves. Buffer while the deadline
        // is active so a server that sends headers and stalls cannot hang a stage.
        const body = await response.arrayBuffer();
        signal.throwIfAborted();
        return new Response([204, 205, 304].includes(response.status) ? null : body, {
          status: response.status, statusText: response.statusText, headers: response.headers,
        });
      })()]);
    } finally {
      clearTimeout(timer);
      if (onAbort) signal.removeEventListener('abort', onAbort);
    }
  };
}

export function reviewAuthConfig(env: ReviewEnvironment = process.env) {
  const url = env.SUPABASE_URL;
  const publishableKey = env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
  } catch { return null; }
  // A secret key accidentally placed in the public setting must fail closed.
  if (publishableKey.startsWith('sb_secret_')) return null;
  if (publishableKey.split('.').length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(publishableKey.split('.')[1], 'base64url').toString());
      if (payload.role !== 'anon') return null;
    } catch { return null; }
  } else if (!publishableKey.startsWith('sb_publishable_')) return null;
  return { url, publishableKey };
}

export async function authenticateReviewRequest(
  authorization: string | undefined,
  env: ReviewEnvironment = process.env,
  clientFactory: ReviewClientFactory = createClient,
  transport: ReviewTransportOptions = {},
): Promise<{ userId: string; email: string | null; client: SupabaseClient }> {
  const config = reviewAuthConfig(env);
  if (!config) throw new ReviewAccessError(503, 'AUTH_NOT_CONFIGURED', 'Organization sign-in is awaiting database configuration.');
  const match = /^Bearer ([A-Za-z0-9._~-]{20,8192})$/.exec(authorization ?? '');
  if (!match) throw new ReviewAccessError(401, 'INVALID_SESSION', 'Sign in to continue.');
  const token = match[1];
  const client = clientFactory(config.url, config.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    db: { retry: false },
    global: { headers: { Authorization: `Bearer ${token}` }, fetch: createReviewFetch(transport.fetch, transport.timeoutMs) },
  });
  // getUser checks the live Auth service rather than trusting an unverified JWT payload.
  let result: Awaited<ReturnType<typeof client.auth.getUser>>;
  try { result = await client.auth.getUser(token); }
  catch { throw new ReviewAccessError(503, 'AUTH_UNAVAILABLE', 'Organization sign-in is temporarily unavailable. Please retry shortly.'); }
  const { data, error } = result;
  if (error && (!error.status || error.status >= 500 || error.status === 429)) {
    throw new ReviewAccessError(503, 'AUTH_UNAVAILABLE', 'Organization sign-in is temporarily unavailable. Please retry shortly.');
  }
  if (error || !data.user || data.user.is_anonymous) {
    throw new ReviewAccessError(401, 'INVALID_SESSION', 'Your session has expired. Please sign in again.');
  }
  return { userId: data.user.id, email: data.user.email ?? null, client };
}
