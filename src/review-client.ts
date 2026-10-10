import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ReviewAction, ReviewConfig, ReviewErrorBody } from '../lib/review/types';

export class ReviewRequestError extends Error {
  constructor(message: string, public readonly code: string, public readonly requestId?: string) { super(message); this.name = 'ReviewRequestError'; }
}

export async function loadReviewConfig(): Promise<ReviewConfig> {
  const response = await fetch('/api/review', { cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ReviewRequestError('Review configuration could not be loaded. Refresh to try again.', 'CONFIG_UNAVAILABLE');
  return response.json() as Promise<ReviewConfig>;
}

export function createReviewAuth(config: ReviewConfig): SupabaseClient | null {
  if (!config.authConfigured || !config.supabaseUrl || !config.supabasePublishableKey) return null;
  return createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'sparecycle-review-auth' },
  });
}

export async function reviewRequest<T>(auth: SupabaseClient, action: ReviewAction): Promise<T> {
  const { data, error } = await auth.auth.getSession();
  if (error || !data.session) throw new ReviewRequestError('Sign in to your organization to continue.', 'SESSION_REQUIRED');
  const response = await fetch('/api/review', {
    method: 'POST', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify(action),
  });
  const result: { data?: T } & Partial<ReviewErrorBody> = await response.json().catch(() => ({}));
  if (!response.ok) throw new ReviewRequestError(result.error || 'The request could not be completed. Try again.', result.code || 'REQUEST_FAILED', result.requestId);
  return result.data as T;
}

export function publicGitHubUrl(value: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password ? url.toString() : null; } catch { return null; }
}
