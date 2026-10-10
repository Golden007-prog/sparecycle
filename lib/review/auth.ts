import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export class ReviewAccessError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = 'ReviewAccessError';
  }
}

export type ReviewEnvironment = Record<string, string | undefined>;
export type ReviewClientFactory = typeof createClient;

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
): Promise<{ userId: string; email: string | null; client: SupabaseClient }> {
  const config = reviewAuthConfig(env);
  if (!config) throw new ReviewAccessError(503, 'AUTH_NOT_CONFIGURED', 'Organization sign-in is awaiting database configuration.');
  const match = /^Bearer ([A-Za-z0-9._~-]{20,8192})$/.exec(authorization ?? '');
  if (!match) throw new ReviewAccessError(401, 'INVALID_SESSION', 'Sign in to continue.');
  const token = match[1];
  const client = clientFactory(config.url, config.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  // getUser checks the live Auth service rather than trusting an unverified JWT payload.
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) {
    throw new ReviewAccessError(401, 'INVALID_SESSION', 'Your session has expired. Please sign in again.');
  }
  return { userId: data.user.id, email: data.user.email ?? null, client };
}
