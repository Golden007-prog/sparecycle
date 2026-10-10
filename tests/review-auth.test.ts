import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { requestReviewAccountEmail, reviewAuthLinkError, updateReviewPassword, watchReviewSession } from '../src/review-client.js';

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
