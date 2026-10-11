import type { ReviewSsoProvider } from './types.js';

/** A public login choice, never proof of organization membership or session provenance. */
export function reviewSsoProvider(env: Record<string, string | undefined>, authConfigured: boolean): ReviewSsoProvider | null {
  if (!authConfigured || env.REVIEW_SSO_ENABLED !== 'true') return null;
  const id = env.REVIEW_SSO_PROVIDER_ID ?? '';
  const label = (env.REVIEW_SSO_DISPLAY_NAME ?? 'Company SSO').trim();
  if (id.length > 50 || !/^custom:[a-z0-9][a-z0-9:-]*$/.test(id)) return null;
  if (!label || label.length > 48 || /[\u0000-\u001f\u007f<>]/.test(label)) return null;
  return { id: id as ReviewSsoProvider['id'], label };
}
