import { createClient, type AuthChangeEvent, type Session, type SupabaseClient } from '@supabase/supabase-js';
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

// Subscribe before restoring the session: an email callback may emit recovery
// during SDK initialization. Keep the callback synchronous to avoid Auth locks.
export function watchReviewSession(client: SupabaseClient, onSession: (session: Session | null, event: AuthChangeEvent) => void, onError: () => void): () => void {
  let active = true, revision = 0;
  const subscription = client.auth.onAuthStateChange((event, session) => {
    revision += 1;
    if (active) onSession(session, event);
  });
  const initialRevision = revision;
  void client.auth.getSession().then(({ data, error }) => {
    if (!active) return;
    if (error) onError();
    else if (revision === initialRevision) onSession(data.session, 'INITIAL_SESSION');
  }).catch(() => { if (active) onError(); });
  return () => { active = false; subscription.data.subscription.unsubscribe(); };
}

export function reviewAuthLinkError(hash: string): string | null {
  const values = new URLSearchParams(hash.replace(/^#/, ''));
  if (!values.has('error') && !values.has('error_code')) return null;
  // Never echo provider URL text, which may be untrusted or contain identifiers.
  return 'This email link is invalid or has expired. Request a new recovery or confirmation email below.';
}

export async function requestReviewAccountEmail(client: SupabaseClient, mode: 'forgot' | 'resend', email: string, origin: string): Promise<void> {
  const redirectTo = new URL('/review', origin).href;
  const result = mode === 'forgot'
    ? await client.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    : await client.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: redirectTo } });
  if (result.error) throw new Error('The email request could not be completed. Wait before retrying. If it continues, ask your deployment administrator to check email delivery and authentication settings.');
}

export async function updateReviewPassword(client: SupabaseClient, password: string, confirmation: string, recoverySession: boolean): Promise<void> {
  if (!recoverySession) throw new Error('Open a valid password recovery link before choosing a new password.');
  if (password.length < 12 || password.length > 128) throw new Error('Use a password between 12 and 128 characters.');
  if (password !== confirmation) throw new Error('The passwords do not match. Enter the same new password twice.');
  const current = await client.auth.getUser();
  if (current.error || !current.data.user) throw new Error('Your recovery session has expired. Request a new password recovery email.');
  const result = await client.auth.updateUser({ password });
  if (result.error) throw new Error('The password could not be updated. Choose a different strong password, or request a fresh recovery link if this one expired.');
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
