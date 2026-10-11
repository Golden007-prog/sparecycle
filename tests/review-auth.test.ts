import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { createReviewAccount, requestReviewAccountEmail, reviewAuthLinkError, reviewAuthRedirect, startReviewCompanySignIn, startReviewGoogleSignIn, updateReviewPassword, verifyReviewEmailCode, watchReviewSession } from '../src/review-client.js';

const client = (auth: object) => ({ auth }) as unknown as SupabaseClient;
const session = { user: { id: 'test-user' } } as Session;

test('recovery email uses the canonical Review path without carrying incoming URL parameters', async () => {
  const calls: unknown[] = [];
  await requestReviewAccountEmail(client({ resetPasswordForEmail: async (...args: unknown[]) => { calls.push(args); return { error: null }; } }), 'forgot', ' person@example.invalid ', 'https://pilot.example/review?untrusted=next');
  assert.deepEqual(calls, [['person@example.invalid', { redirectTo: 'https://pilot.example/review' }]]);
});

test('confirmation resend uses signup type and the same Review redirect', async () => {
  const calls: unknown[] = [];
  await requestReviewAccountEmail(client({ resend: async (args: unknown) => { calls.push(args); return { error: null }; } }), 'resend', 'person@example.invalid', 'https://pilot.example');
  assert.deepEqual(calls, [{ type: 'signup', email: 'person@example.invalid', options: { emailRedirectTo: 'https://pilot.example/review' } }]);
});

test('email provider failures give neutral feedback without exposing provider details', async () => {
  await assert.rejects(requestReviewAccountEmail(client({ resend: async () => ({ error: { message: 'private SMTP recipient information' } }) }), 'resend', 'person@example.invalid', 'https://pilot.example'), error => {
    assert.match((error as Error).message, /email request could not be completed/);
    assert.doesNotMatch((error as Error).message, /private SMTP/);
    return true;
  });
});

test('password updates require a recovery event and matching bounded passwords before contacting Auth', async () => {
  const auth = client({ getUser: () => { throw new Error('must not contact Auth'); } });
  await assert.rejects(updateReviewPassword(auth, 'valid-password-123', 'valid-password-123', false), /valid password recovery link/);
  await assert.rejects(updateReviewPassword(auth, 'short', 'short', true), /between 12 and 128/);
  await assert.rejects(updateReviewPassword(auth, 'x'.repeat(129), 'x'.repeat(129), true), /between 12 and 128/);
  await assert.rejects(updateReviewPassword(auth, 'valid-password-123', 'different-password', true), /do not match/);
});

test('expired recovery sessions cannot invoke password update', async () => {
  await assert.rejects(updateReviewPassword(client({ getUser: async () => ({ error: new Error('expired'), data: { user: null } }), updateUser: () => { throw new Error('must not update'); } }), 'valid-password-123', 'valid-password-123', true), /recovery session has expired/);
});

test('a valid recovery session submits only the new password after live user validation', async () => {
  const calls: unknown[] = [];
  await updateReviewPassword(client({ getUser: async () => { calls.push('verify'); return { error: null, data: { user: { id: 'test-user' } } }; }, updateUser: async (value: unknown) => { calls.push(value); return { error: null }; } }), 'valid-password-123', 'valid-password-123', true);
  assert.deepEqual(calls, ['verify', { password: 'valid-password-123' }]);
});

test('password rejection preserves failure rather than claiming the update succeeded', async () => {
  await assert.rejects(updateReviewPassword(client({ getUser: async () => ({ error: null, data: { user: { id: 'test-user' } } }), updateUser: async () => ({ error: new Error('provider rejection') }) }), 'valid-password-123', 'valid-password-123', true), /password could not be updated/);
});

test('session observer catches recovery emitted during initialization before the restored session result', async () => {
  const events: AuthChangeEvent[] = [];
  let listener!: (event: AuthChangeEvent, value: Session | null) => void;
  let resolveSession!: (value: unknown) => void;
  let unsubscribed = false;
  const auth = client({
    onAuthStateChange: (callback: typeof listener) => { listener = callback; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; },
    getSession: () => { assert.ok(listener); return new Promise(resolve => { resolveSession = resolve; }); },
  });
  const stop = watchReviewSession(auth, (_value, event) => events.push(event), () => assert.fail('unexpected restore failure'));
  listener('PASSWORD_RECOVERY', session);
  resolveSession({ data: { session: null }, error: null });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(events, ['PASSWORD_RECOVERY']);
  stop();
  listener('SIGNED_IN', session);
  assert.equal(unsubscribed, true);
  assert.deepEqual(events, ['PASSWORD_RECOVERY']);
});

test('session observer restores ordinary sessions and reports restore errors', async () => {
  const makeAuth = (result: unknown) => client({ onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), getSession: async () => result });
  const events: unknown[] = [];
  const stop = watchReviewSession(makeAuth({ data: { session }, error: null }), (value, event) => events.push([value, event]), () => assert.fail());
  await new Promise(resolve => setImmediate(resolve));
  stop();
  assert.deepEqual(events, [[session, 'INITIAL_SESSION']]);
  let errors = 0;
  const stopError = watchReviewSession(makeAuth({ data: { session: null }, error: new Error('expired') }), () => assert.fail(), () => { errors += 1; });
  await new Promise(resolve => setImmediate(resolve));
  stopError();
  assert.equal(errors, 1);
});

test('callback errors have useful expired-link feedback without reflecting arbitrary URL content', () => {
  const message = reviewAuthLinkError('#error=access_denied&error_code=otp_expired&error_description=PRIVATE_TOKEN');
  assert.match(message ?? '', /invalid or has expired/);
  assert.doesNotMatch(message ?? '', /PRIVATE_TOKEN/);
  assert.equal(reviewAuthLinkError('#access_token=synthetic&type=recovery'), null);
  assert.equal(reviewAuthLinkError(''), null);
});

test('Google sign-in requests identity scopes and discards untrusted next/query destinations', async () => {
  const calls: unknown[] = [];
  await startReviewGoogleSignIn(client({ signInWithOAuth: async (value: unknown) => { calls.push(value); return {error:null}; } }), true, 'https://pilot.example/review?next=https://other.example');
  assert.deepEqual(calls,[{provider:'google',options:{redirectTo:'https://pilot.example/review',scopes:'openid email profile',queryParams:{prompt:'select_account'}}}]);
});

test('disabled or insecure Google flows cannot contact the identity provider', async () => {
  const auth = client({ signInWithOAuth: () => assert.fail('must not start OAuth') });
  await assert.rejects(startReviewGoogleSignIn(auth,false,'https://pilot.example'),/not enabled/);
  await assert.rejects(startReviewGoogleSignIn(auth,true,'http://pilot.example'),/secure SpareCycle/);
  await assert.rejects(startReviewGoogleSignIn(auth,true,'javascript:alert(1)'));
});

test('Google configuration failures never reflect provider payloads', async () => {
  await assert.rejects(startReviewGoogleSignIn(client({signInWithOAuth:async()=>({error:{message:'SECRET_CONFIGURATION'}})}),true,'https://pilot.example'),error=>{
    assert.match((error as Error).message,/could not start/); assert.doesNotMatch((error as Error).message,/SECRET_CONFIGURATION/); return true;
  });
});

test('OAuth callback query errors are sanitized without treating ordinary callback codes as errors', () => {
  assert.match(reviewAuthLinkError('', '?error=access_denied&error_description=SECRET_TOKEN') ?? '',/Sign-in could not be completed/);
  assert.doesNotMatch(reviewAuthLinkError('', '?error=access_denied&error_description=SECRET_TOKEN') ?? '',/SECRET_TOKEN/);
  assert.equal(reviewAuthLinkError('', '?code=synthetic-auth-code'),null);
});

test('company OIDC uses the configured custom provider, minimal identity scopes and canonical callback', async () => {
  const calls: unknown[] = [];
  await startReviewCompanySignIn(client({ signInWithOAuth: async (value: unknown) => { calls.push(value); return { error: null }; } }), { id: 'custom:company', label: 'Company identity' }, 'https://pilot.example/review?next=https://outside.invalid#token');
  assert.deepEqual(calls, [{ provider: 'custom:company', options: { redirectTo: 'https://pilot.example/review', scopes: 'openid email profile' } }]);
});

test('disabled or invalid company providers never begin authentication', async () => {
  const auth = client({ signInWithOAuth: () => assert.fail('must not contact provider') });
  for (const provider of [null, { id: 'google', label: 'Company' }, { id: 'custom:', label: 'Company' }, { id: 'custom:secret?x=y', label: 'Company' }, { id: 'custom:company', label: '<script>' }]) {
    await assert.rejects(startReviewCompanySignIn(auth, provider as Parameters<typeof startReviewCompanySignIn>[1], 'https://pilot.example'), /not enabled/);
  }
});

test('OIDC errors are sanitized and do not expose identity provider payloads', async () => {
  await assert.rejects(startReviewCompanySignIn(client({ signInWithOAuth: async () => ({ error: { message: 'PRIVATE_CLIENT_SECRET' } }) }), { id: 'custom:company', label: 'Company' }, 'https://pilot.example'), error => {
    assert.match((error as Error).message, /Company sign-in could not start/);
    assert.doesNotMatch((error as Error).message, /PRIVATE_CLIENT_SECRET/); return true;
  });
});

test('all account redirects reject insecure schemes and credentials, permitting explicit local development', async () => {
  for (const origin of ['http://pilot.example', 'https://name:password@pilot.example', 'https://name@pilot.example', 'data:text/html,bad', 'javascript:alert(1)']) {
    assert.throws(() => reviewAuthRedirect(origin));
    await assert.rejects(requestReviewAccountEmail(client({ resend: () => assert.fail('must not send') }), 'resend', 'person@example.invalid', origin));
  }
  assert.equal(reviewAuthRedirect('http://localhost:3000/a?next=https://other.invalid'), 'http://localhost:3000/review');
  assert.equal(reviewAuthRedirect('https://pilot.example/a?token=private#fragment'), 'https://pilot.example/review');
});

test('signup validates inputs and never adds user-controlled organization or role metadata', async () => {
  const calls: unknown[] = [];
  const auth = client({ signUp: async (value: unknown) => { calls.push(value); return { error: null, data: { session: null } }; } });
  assert.equal(await createReviewAccount(auth, ' person@example.invalid ', 'new-private-password', 'https://pilot.example/other'), null);
  assert.deepEqual(calls, [{ email: 'person@example.invalid', password: 'new-private-password', options: { emailRedirectTo: 'https://pilot.example/review' } }]);
  for (const [email, password] of [['bad-email', 'long-password'], ['person@example.invalid', 'short'], ['person@example.invalid', 'x'.repeat(129)]]) await assert.rejects(createReviewAccount(auth, email, password, 'https://pilot.example'));
  assert.equal(calls.length, 1);
});

test('signup failures neither claim mail delivery nor expose account or SMTP details', async () => {
  await assert.rejects(createReviewAccount(client({ signUp: async () => ({ error: { message: 'PRIVATE_SMTP_RECIPIENT' } }) }), 'person@example.invalid', 'new-private-password', 'https://pilot.example'), error => {
    assert.match((error as Error).message, /Account creation could not be completed/);
    assert.doesNotMatch((error as Error).message, /PRIVATE_SMTP_RECIPIENT/); return true;
  });
});

test('confirmation and recovery codes use distinct provider purposes and return only verified sessions', async () => {
  const calls: unknown[] = [];
  const auth = client({ verifyOtp: async (value: unknown) => { calls.push(value); return { error: null, data: { session, user: session.user } }; } });
  assert.equal(await verifyReviewEmailCode(auth, ' person@example.invalid ', ' 123456 ', 'confirmation'), session);
  assert.equal(await verifyReviewEmailCode(auth, 'person@example.invalid', '654321', 'recovery'), session);
  assert.deepEqual(calls, [{ email: 'person@example.invalid', token: '123456', type: 'email' }, { email: 'person@example.invalid', token: '654321', type: 'recovery' }]);
});

test('malformed email codes cannot invoke Auth; rejected, missing or mismatched sessions never recover an account', async () => {
  for (const token of ['', '12345', '12345678901', 'a23456', '123 456']) await assert.rejects(verifyReviewEmailCode(client({ verifyOtp: () => assert.fail('must not contact Auth') }), 'person@example.invalid', token, 'recovery'), /digit code/);
  for (const result of [{ error: { message: 'PRIVATE_TOKEN' }, data: {} }, { error: null, data: { session: null, user: session.user } }, { error: null, data: { session, user: { id: 'different' } } }]) {
    await assert.rejects(verifyReviewEmailCode(client({ verifyOtp: async () => result }), 'person@example.invalid', '123456', 'recovery'), error => { assert.match((error as Error).message, /invalid or has expired/); assert.doesNotMatch((error as Error).message, /PRIVATE_TOKEN/); return true; });
  }
});
