import { createClient, type AuthChangeEvent, type Session, type SupabaseClient } from '@supabase/supabase-js';
import type { ReviewAction, ReviewConfig, ReviewErrorBody, ReviewSsoProvider } from '../lib/review/types';
import { reviewSsoProvider } from '../lib/review/auth-options';

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
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: 'sparecycle-review-auth' },
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

export function reviewAuthLinkError(hash: string, search = ''): string | null {
  const values = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search.replace(/^\?/, ''));
  if (query.has('error') || query.has('error_code')) return 'Sign-in could not be completed. Try again, use your email code, or request a fresh link.';
  if (!values.has('error') && !values.has('error_code')) return null;
  // Never echo provider URL text, which may be untrusted or contain identifiers.
  return 'This email link is invalid or has expired. Request a new recovery or confirmation email below.';
}

export function reviewAuthRedirect(origin: string): string {
  const base = new URL(origin);
  if (base.username || base.password || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) {
    throw new Error('Open the secure SpareCycle website before signing in.');
  }
  return new URL('/review', base.origin).href;
}

function accountEmail(email: string): string {
  const value = email.trim();
  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Enter a valid email address.');
  return value;
}

export async function startReviewCompanySignIn(client: SupabaseClient, provider: ReviewSsoProvider | null | undefined, origin: string): Promise<void> {
  const safe = reviewSsoProvider({ REVIEW_SSO_ENABLED: 'true', REVIEW_SSO_PROVIDER_ID: provider?.id, REVIEW_SSO_DISPLAY_NAME: provider?.label }, true);
  if (!safe) throw new Error('Company SSO is not enabled for this workspace yet. Use your email and password.');
  const result = await client.auth.signInWithOAuth({ provider: safe.id, options: { redirectTo: reviewAuthRedirect(origin), scopes: 'openid email profile' } });
  if (result.error) throw new Error('Company sign-in could not start. Ask your administrator to check the identity connection, or use email sign-in.');
}

export async function startReviewGoogleSignIn(client: SupabaseClient, enabled: boolean, origin: string): Promise<void> {
  if (!enabled) throw new Error('Google sign-in is not enabled for this workspace yet. Use your email and password.');
  const result = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: reviewAuthRedirect(origin), scopes: 'openid email profile', queryParams: { prompt: 'select_account' } } });
  if (result.error) throw new Error('Google sign-in could not start. Try email sign-in or ask your administrator to check the Google connection.');
}

export async function requestReviewAccountEmail(client: SupabaseClient, mode: 'forgot' | 'resend', email: string, origin: string): Promise<void> {
  const redirectTo = reviewAuthRedirect(origin);
  const address = accountEmail(email);
  const result = mode === 'forgot'
    ? await client.auth.resetPasswordForEmail(address, { redirectTo })
    : await client.auth.resend({ type: 'signup', email: address, options: { emailRedirectTo: redirectTo } });
  if (result.error) throw new Error('The email request could not be completed. Wait before retrying. If it continues, ask your deployment administrator to check email delivery and authentication settings.');
}

export async function createReviewAccount(client: SupabaseClient, email: string, password: string, origin: string): Promise<Session | null> {
  if (password.length < 12 || password.length > 128) throw new Error('Use a password between 12 and 128 characters.');
  const result = await client.auth.signUp({ email: accountEmail(email), password, options: { emailRedirectTo: reviewAuthRedirect(origin) } });
  if (result.error) throw new Error('Account creation could not be completed. Try signing in if you already have an account, or ask your administrator to check email delivery.');
  return result.data.session;
}

/** Email codes work on another device and are not consumed by email link scanners. */
export async function verifyReviewEmailCode(client: SupabaseClient, email: string, token: string, purpose: 'confirmation' | 'recovery'): Promise<Session> {
  const address = accountEmail(email), code = token.trim();
  if (!/^\d{6,10}$/.test(code)) throw new Error('Enter the 6–10 digit code from your most recent email.');
  const result = await client.auth.verifyOtp({ email: address, token: code, type: purpose === 'recovery' ? 'recovery' : 'email' });
  if (result.error || !result.data.session || !result.data.user || result.data.session.user.id !== result.data.user.id) throw new Error('This email code is invalid or has expired. Request a new code and try again.');
  return result.data.session;
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
