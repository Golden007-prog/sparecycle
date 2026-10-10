import assert from 'node:assert/strict';
import test from 'node:test';
import type { HttpRequest, HttpResponse } from '../lib/http.js';
import { createAnalyzeHandler, RequestLimiter } from '../api/analyze.js';
import health from '../api/health.js';
import { AnalysisError, analysisRequestSchema, DEFAULT_MODEL, MAX_BODY_BYTES, runAnalysis } from '../lib/ai.js';
import type { AnalysisResponse, CompletionProvider } from '../lib/ai.js';
import { sampleRecoveryBatch, defaultRecoveryLimits } from '../lib/recovery-data.js';
import { planRecovery } from '../lib/recovery.js';

const env = { NEBIUS_API_KEY: 'test-only-not-a-real-key', LANGSMITH_TRACING: 'false' };
const intake = { devices: [{ label: 'Laptop A', model: 'Latitude 5490', needs: ['8 GB RAM'], repairMinutes: 25, note: 'Technician reported missing RAM.', missing: ['exact approved SKU', 'QA and wipe review'] }], summary: 'One laptop draft.', missing: [] };
const result: AnalysisResponse = { data: intake, meta: { provider: 'Nebius Token Factory', model: DEFAULT_MODEL, latencyMs: 1, tools: [] } };

function request(body: unknown = { action: 'intake', text: 'Laptop A needs RAM; technician estimated 25 minutes.' }, headers: Record<string, string> = {}, method = 'POST'): HttpRequest {
  return { method, body, headers: { host: 'localhost:3000', 'content-type': 'application/json', ...headers }, socket: { remoteAddress: '127.0.0.1' } } as unknown as HttpRequest;
}

function response() {
  const state = { status: 200, body: undefined as unknown, headers: {} as Record<string, string> };
  const res = {
    setHeader(name: string, value: string) { state.headers[name] = value; return res; },
    status(code: number) { state.status = code; return res; },
    json(body: unknown) { state.body = body; return res; },
  } as unknown as HttpResponse;
  return { state, res };
}

test('valid intake uses strict structured output with a bounded model request', async () => {
  let called = false;
  const provider: CompletionProvider = async (parameters) => {
    called = true;
    assert.equal(parameters.model, DEFAULT_MODEL);
    assert.deepEqual(parameters.chat_template_kwargs, { enable_thinking: false });
    assert.equal(parameters.max_completion_tokens, 2_400);
    assert.equal(parameters.response_format?.type, 'json_schema');
    assert.equal(parameters.stream, false);
    assert.match(String(parameters.messages[0].content), /untrusted data/);
    assert.match(String(parameters.messages[0].content), /never infer compatibility/i);
    return { choices: [{ message: { content: JSON.stringify(intake) }, finish_reason: 'stop' }] };
  };
  const actual = await runAnalysis({ action: 'intake', text: 'Laptop A needs RAM; technician estimated 25 minutes.' }, { env, provider });
  assert(called);
  assert.deepEqual(actual.data, intake);
  assert.equal(actual.meta.provider, 'Nebius Token Factory');
  assert.equal(actual.meta.traceId, undefined);
});

test('Lightning thinking control is not imposed on another configured model', async () => {
  await runAnalysis({ action: 'intake', text: 'Laptop A needs RAM.' }, {
    env: { ...env, NEBIUS_MODEL: 'other-provider/other-model' },
    provider: async parameters => {
      assert.equal(parameters.model, 'other-provider/other-model');
      assert.equal(parameters.chat_template_kwargs, undefined);
      assert.equal(parameters.max_completion_tokens, 2_400);
      return { choices: [{ message: { content: JSON.stringify(intake) }, finish_reason: 'stop' }] };
    },
  });
});

test('explanation cannot bypass server-side output validation', async () => {
  const provider: CompletionProvider = async () => ({ choices: [{ message: { content: JSON.stringify({ summary: 'Matched.', risks: [], nextAction: 'Review allocations with the technician.' }) } }] });
  const actual = await runAnalysis({ action: 'explain', batch: sampleRecoveryBatch, limits: defaultRecoveryLimits }, { env, provider });
  assert.deepEqual(actual.data, { summary: 'Matched.', risks: [], nextAction: 'Review allocations with the technician.' });
  await assert.rejects(runAnalysis({ action: 'intake', text: 'Laptop A needs RAM.' }, { env, provider }), (error: unknown) => error instanceof AnalysisError && error.code === 'AI_RESPONSE_INVALID');
});

test('missing API configuration never calls provider or fabricates a result', async () => {
  let called = false;
  await assert.rejects(runAnalysis({ action: 'intake', text: 'Laptop A needs RAM.' }, {
    env: {}, provider: async () => { called = true; return { choices: [] }; },
  }), (error: unknown) => error instanceof AnalysisError && error.status === 503);
  assert.equal(called, false);
  const capture = response();
  await createAnalyzeHandler({ env: {}, invoke: async () => { called = true; return result; } })(request(), capture.res);
  assert.equal(capture.state.status, 503);
  assert.equal(called, false);
});

test('provider errors are sanitized and never leak keys or intake text', async () => {
  const secretMessage = 'NEBIUS_KEY_PRIVATE private-intake-note';
  await assert.rejects(runAnalysis({ action: 'intake', text: 'Laptop A needs RAM.' }, { env, provider: async () => { throw new Error(secretMessage); } }), (error: unknown) => error instanceof AnalysisError && error.status === 502 && !error.message.includes(secretMessage));
  const capture = response();
  await createAnalyzeHandler({ env, invoke: async () => { throw new Error(secretMessage); } })(request(), capture.res);
  assert.equal(capture.state.status, 502);
  assert(!JSON.stringify(capture.state.body).includes(secretMessage));
});

test('malformed, excessive, injected fields and complex request contexts fail before inference', async () => {
  let calls = 0;
  const handler = createAnalyzeHandler({ env, invoke: async () => { calls += 1; return result; } });
  const invalid: unknown[] = [
    null, '{invalid json', { action: 'other' }, { action: 'intake', text: 'short' },
    { action: 'intake', text: 'x'.repeat(6_001) },
    { action: 'intake', text: 'Laptop A needs RAM.', model: 'attacker-model' },
    { action: 'explain', context: { raw: 'x'.repeat(16_001) } },
    { action: 'explain', context: { a: { b: { c: { d: { e: { f: { g: { h: { i: true } } } } } } } } } },
    { action: 'intake', text: 'x'.repeat(MAX_BODY_BYTES) },
    JSON.parse('{"action":"explain","context":{"__proto__":{"polluted":true}}}'),
  ];
  for (const body of invalid) {
    const capture = response();
    await handler(request(body), capture.res);
    assert.equal(capture.state.status, 400, JSON.stringify(body)?.slice(0, 100));
  }
  assert.equal(calls, 0);
});

test('unsafe context keys are rejected before Zod can discard them in raw or parsed JSON', async () => {
  let calls = 0;
  const handler = createAnalyzeHandler({ env, invoke: async () => { calls += 1; return result; } });
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const unsafe = { [key]: { polluted: true } };
    for (const extra of [unsafe, { nested: unsafe }, { candidates: [unsafe] }]) {
      const raw = JSON.stringify({ action: 'plan', batch: { ...sampleRecoveryBatch, ...extra }, limits: defaultRecoveryLimits });
      const parsed = JSON.parse(raw);
      assert.equal(analysisRequestSchema.safeParse(parsed).success, false, `${key} must fail schema validation`);
      for (const body of [raw, parsed]) {
        const capture = response();
        await handler(request(body), capture.res);
        assert.equal(capture.state.status, 400, `${key} must fail before inference`);
      }
    }
  }
  assert.equal(calls, 0);
  const valid = response();
  await handler(request({ action: 'intake', text: 'Literal text containing __proto__ is harmless.' }), valid.res);
  assert.equal(valid.state.status, 200);
  assert.equal(calls, 1);
});

test('origin rejection and method checks happen before paid calls; no-origin clients work', async () => {
  let calls = 0;
  const handler = createAnalyzeHandler({ env, invoke: async () => { calls += 1; return result; } });
  const foreign = response();
  await handler(request(undefined, { origin: 'https://unrelated.example' }), foreign.res);
  assert.equal(foreign.state.status, 403);
  const method = response();
  await handler(request(undefined, {}, 'GET'), method.res);
  assert.equal(method.state.status, 405);
  assert.equal(calls, 0);
  const cli = response();
  await handler(request(), cli.res);
  assert.equal(cli.state.status, 200);
  assert.deepEqual(cli.state.body, result);
  const sameOrigin = response();
  await handler(request(undefined, { origin: 'http://localhost:3000' }), sameOrigin.res);
  assert.equal(sameOrigin.state.status, 200);
  assert.equal(calls, 2);
});

test('a burst exceeding the per-IP quota does not invoke the provider', async () => {
  let calls = 0;
  const handler = createAnalyzeHandler({ env, invoke: async () => { calls += 1; return result; } });
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const capture = response();
    await handler(request(), capture.res);
    assert.equal(capture.state.status, attempt < 5 ? 200 : 429);
  }
  assert.equal(calls, 5);
});

test('global concurrency is bounded and released after provider failure', async () => {
  const limiter = new RequestLimiter();
  const first = limiter.acquire('one');
  const second = limiter.acquire('two');
  assert(first && second);
  assert.equal(limiter.acquire('three'), null);
  assert.equal(limiter.acquire('one'), null);
  first(); second();
  const third = limiter.acquire('three');
  assert(third); third();
  let attempts = 0;
  const handler = createAnalyzeHandler({ env, invoke: async () => { attempts += 1; if (attempts === 1) throw new Error('failure'); return result; } });
  const failed = response();
  await handler(request(), failed.res);
  assert.equal(failed.state.status, 502);
  const recovery = response();
  await handler(request(), recovery.res);
  assert.equal(recovery.state.status, 200);
});

test('rate windows expire and the global hourly quota caps many separate IPs', () => {
  let current = 0;
  const limiter = new RequestLimiter(() => current);
  for (let i = 0; i < 5; i += 1) limiter.acquire('same')!();
  assert.equal(limiter.acquire('same'), null);
  current = 600_001;
  limiter.acquire('same')!();
  for (let i = 0; i < 54; i += 1) limiter.acquire(`ip-${i}`)!();
  assert.equal(limiter.acquire('another'), null);
  current = 3_600_001;
  const reset = limiter.acquire('another');
  assert(reset); reset();
});

test('refusal, truncated output, invalid JSON and impossible extraction are rejected', async () => {
  const completions = [
    { choices: [{ message: { content: null, refusal: 'Cannot answer' } }] },
    { choices: [{ message: { content: JSON.stringify(intake) }, finish_reason: 'length' }] },
    { choices: [{ message: { content: 'not json' } }] },
    { choices: [{ message: { content: JSON.stringify({ ...intake, devices: [{ ...intake.devices[0], repairMinutes: 'tomorrow' }] }) } }] },
    { choices: [{ message: { content: JSON.stringify({ ...intake, devices: [{ ...intake.devices[0], repairMinutes: -20 }] }) } }] },
  ];
  for (const completion of completions) {
    await assert.rejects(runAnalysis({ action: 'intake', text: 'Laptop A needs RAM.' }, { env, provider: async () => completion }), (error: unknown) => error instanceof AnalysisError && error.status === 502);
  }
});

test('health endpoint exposes only configuration flags, not credentials', () => {
  const capture = response();
  health(request(undefined, {}, 'GET'), capture.res);
  assert.equal(capture.state.status, 200);
  assert.deepEqual(Object.keys(capture.state.body as object).sort(), ['aiConfigured', 'model', 'service', 'tracingConfigured']);
  assert.equal(typeof (capture.state.body as { aiConfigured: unknown }).aiConfigured, 'boolean');
  const wrongMethod = response();
  health(request(), wrongMethod.res);
  assert.equal(wrongMethod.state.status, 405);
});



const planInput = { action: 'plan' as const, batch: sampleRecoveryBatch, limits: defaultRecoveryLimits };
const explanation = { summary: 'The server computed a proposed recovery plan.', risks: ['Technician review, data wiping and quality checks remain required.'], nextAction: 'Review the allocation list before reserving parts.' };
function content(value: unknown) { return { choices: [{ message: { content: JSON.stringify(value) }, finish_reason: 'stop' }] }; }
function call(name: string, args: unknown = {}, id = 'call-1') {
  return { id, type: 'function' as const, function: { name, arguments: JSON.stringify(args) } };
}
function toolCalls(...calls: ReturnType<typeof call>[]) {
  return { choices: [{ message: { content: null, tool_calls: calls }, finish_reason: 'tool_calls' }] };
}

test('agent executes real inventory, inspection and deterministic planning tools before explanation', async () => {
  const replies = [
    toolCalls(call('list_inventory')),
    toolCalls(call('inspect_device', { deviceId: sampleRecoveryBatch.devices[0].id }, 'call-2')),
    toolCalls(call('compute_recovery_plan', {}, 'call-3')),
    content(explanation),
  ];
  let requests = 0;
  const actual = await runAnalysis(planInput, { env, provider: async parameters => {
    assert.deepEqual(parameters.chat_template_kwargs, { enable_thinking: false });
    if (requests < 3) {
      assert.equal(parameters.tools?.length, 3);
      assert.equal(parameters.parallel_tool_calls, false);
    } else {
      assert.equal(parameters.tools, undefined);
      assert.equal(parameters.response_format?.type, 'json_schema');
      const payload = JSON.parse(String(parameters.messages[1].content));
      assert.deepEqual(payload.plan, planRecovery(sampleRecoveryBatch, defaultRecoveryLimits));
    }
    return replies[requests++];
  } });
  assert.equal(requests, 4);
  assert.deepEqual(actual.plan, planRecovery(sampleRecoveryBatch, defaultRecoveryLimits));
  assert.deepEqual(actual.data, explanation);
  assert.deepEqual(actual.meta.tools.map(event => [event.name, event.status]), [
    ['list_inventory', 'completed'], ['inspect_device', 'completed'], ['compute_recovery_plan', 'completed'],
  ]);
  assert.equal(actual.meta.tools[1].resultCount, 1);
});

test('final tool round forces computation if the model has not requested it', async () => {
  let requests = 0;
  const actual = await runAnalysis(planInput, { env, provider: async parameters => {
    requests += 1;
    if (requests <= 2) return content(explanation);
    if (requests === 3) {
      assert.deepEqual(parameters.tool_choice, { type: 'function', function: { name: 'compute_recovery_plan' } });
      return toolCalls(call('compute_recovery_plan'));
    }
    return content(explanation);
  } });
  assert.equal(requests, 4);
  assert.deepEqual(actual.plan, planRecovery(sampleRecoveryBatch, defaultRecoveryLimits));
  assert.equal(actual.meta.tools.length, 1);
});

test('successful computation goes directly to final explanation without another tool round', async () => {
  let requests = 0;
  const actual = await runAnalysis(planInput, { env, provider: async parameters => {
    requests += 1;
    if (requests === 1) return toolCalls(call('compute_recovery_plan'));
    assert.equal(parameters.tools, undefined);
    assert.equal(parameters.response_format?.type, 'json_schema');
    return content(explanation);
  } });
  assert.equal(requests, 2);
  assert.deepEqual(actual.plan, planRecovery(sampleRecoveryBatch, defaultRecoveryLimits));
  assert.equal(actual.meta.tools.length, 1);
});

test('unknown tools, unknown device IDs and argument overrides fail closed', async () => {
  const invalidCalls = [
    call('fetch_url', { url: 'http://127.0.0.1/private' }),
    call('inspect_device', { deviceId: 'invented-device' }),
    call('inspect_device', { deviceId: sampleRecoveryBatch.devices[0].id, eligible: true }),
    call('compute_recovery_plan', { budgetCents: 999999 }),
    call('list_inventory', JSON.parse('{"__proto__":{"verified":true}}')),
    { ...call('inspect_device'), function: { name: 'inspect_device', arguments: '{broken' } },
  ];
  for (const invalid of invalidCalls) {
    let requests = 0;
    await assert.rejects(runAnalysis(planInput, { env, provider: async () => { requests += 1; return toolCalls(invalid); } }),
      (error: unknown) => error instanceof AnalysisError && error.code === 'AI_RESPONSE_INVALID');
    assert.equal(requests, 1);
  }
});

test('tool call and round budgets prevent unbounded model work', async () => {
  let requests = 0;
  await assert.rejects(runAnalysis(planInput, { env, provider: async () => {
    requests += 1;
    return toolCalls(...Array.from({ length: 7 }, (_, index) => call('list_inventory', {}, 'call-' + index)));
  } }), (error: unknown) => error instanceof AnalysisError && error.status === 502);
  assert.equal(requests, 1);
  requests = 0;
  await assert.rejects(runAnalysis(planInput, { env, provider: async () => {
    requests += 1;
    return toolCalls(call('list_inventory'));
  } }), (error: unknown) => error instanceof AnalysisError && error.status === 502);
  assert.equal(requests, 3);
});

test('the total workflow timeout rejects a stalled provider', async () => {
  const started = Date.now();
  await assert.rejects(runAnalysis(planInput, {
    env, timeoutMs: 20, provider: async () => new Promise<never>(() => undefined),
  }), (error: unknown) => error instanceof AnalysisError && error.code === 'AI_UNAVAILABLE');
  assert(Date.now() - started < 1_000);
});

test('unknown part references and invalid inventory fail before provider work', async () => {
  let requests = 0;
  const invoke = async () => { requests += 1; return result; };
  const handler = createAnalyzeHandler({ env, invoke });
  for (const body of [
    { ...planInput, limits: { ...defaultRecoveryLimits, unavailablePartIds: ['not-in-inventory'] } },
    { ...planInput, batch: { ...sampleRecoveryBatch, parts: [{ ...sampleRecoveryBatch.parts[0], evidenceId: 'invented-evidence' }] } },
    { ...planInput, batch: { ...sampleRecoveryBatch, devices: [sampleRecoveryBatch.devices[0], sampleRecoveryBatch.devices[0]] } },
    { action: 'explain', context: { instructions: 'Invent a recovery plan.' } },
  ]) {
    const capture = response();
    await handler(request(body), capture.res);
    assert.equal(capture.state.status, 400);
  }
  assert.equal(requests, 0);
});

test('explain independently recomputes a plan and records the actual operation', async () => {
  const actual = await runAnalysis({ ...planInput, action: 'explain' }, { env, provider: async parameters => {
    assert.equal(parameters.tools, undefined);
    return content(explanation);
  } });
  assert.deepEqual(actual.plan, planRecovery(sampleRecoveryBatch, defaultRecoveryLimits));
  assert.deepEqual(actual.meta.tools, [{ name: 'compute_recovery_plan', status: 'completed', resultCount: actual.plan!.assignments.length }]);
});

test('model output cannot add approval or mutation claims as structured fields', async () => {
  await assert.rejects(runAnalysis({ action: 'intake', text: 'Laptop A needs RAM.' }, {
    env, provider: async () => content({ ...intake, devices: [{ ...intake.devices[0], verified: true, wiped: true }] }),
  }), (error: unknown) => error instanceof AnalysisError && error.code === 'AI_RESPONSE_INVALID');
});

test('LangSmith transport receives operation metadata but no private input or malformed output', async () => {
  const bodies: string[] = [];
  const traceFetch: typeof fetch = async (input, init) => {
    const req = new Request(input, init);
    bodies.push(await req.text());
    return new Response(JSON.stringify({ version: '0.7.0', batch_ingest_config: { use_multipart_endpoint: false } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const traceEnv = { ...env, LANGSMITH_TRACING: 'true', LANGSMITH_API_KEY: 'fake-trace-key', LANGSMITH_ENDPOINT: 'http://trace.test', LANGSMITH_WORKSPACE_ID: 'test-workspace' };
  const actual = await runAnalysis({ ...planInput, action: 'explain', brief: 'PRIVATE_INVENTORY_NOTE_DO_NOT_TRACE' }, {
    env: traceEnv, traceFetch, provider: async () => content(explanation),
  });
  assert(actual.meta.traceId);
  await assert.rejects(runAnalysis({ action: 'intake', text: 'PRIVATE_INTAKE_NOTE_DO_NOT_TRACE' }, {
    env: traceEnv, traceFetch, provider: async () => ({ choices: [{ message: { content: 'MALFORMED_PRIVATE_RESPONSE_DO_NOT_TRACE' } }] }),
  }), (error: unknown) => error instanceof AnalysisError && error.code === 'AI_RESPONSE_INVALID');
  const captured = bodies.join('\n');
  assert.match(captured, /compute_recovery_plan/);
  assert.match(captured, /resultCount/);
  for (const privateText of ['PRIVATE_INVENTORY_NOTE_DO_NOT_TRACE', 'PRIVATE_INTAKE_NOTE_DO_NOT_TRACE', 'MALFORMED_PRIVATE_RESPONSE_DO_NOT_TRACE', sampleRecoveryBatch.devices[0].intakeNote]) {
    if (privateText) assert(!captured.includes(privateText), 'Private data must not appear in trace payloads');
  }
});

test('trace failure diagnostics contain only bounded counts, finish reasons and HTTP status', async () => {
  const bodies: string[] = [];
  const traceFetch: typeof fetch = async (input, init) => {
    bodies.push(await new Request(input, init).text());
    return new Response(JSON.stringify({ version: '0.7.0', batch_ingest_config: { use_multipart_endpoint: false } }), { headers: { 'content-type': 'application/json' } });
  };
  const traceEnv = { ...env, LANGSMITH_TRACING: 'true', LANGSMITH_API_KEY: 'fake-trace-key', LANGSMITH_ENDPOINT: 'http://trace.test' };
  await assert.rejects(runAnalysis(planInput, {
    env: traceEnv, traceFetch, provider: async () => ({
      choices: [{ message: { content: 'PRIVATE_REASONING_FRAGMENT' }, finish_reason: 'length' }],
      usage: { prompt_tokens: 800, completion_tokens: 1200, total_tokens: 2000, completion_tokens_details: { reasoning_tokens: 1199 } },
    }),
  }), (error: unknown) => error instanceof AnalysisError && error.code === 'AI_RESPONSE_INVALID');
  await assert.rejects(runAnalysis(planInput, {
    env: traceEnv, traceFetch, provider: async () => { throw Object.assign(new Error('PRIVATE_PROVIDER_ERROR_WITH_KEY'), { status: 429 }); },
  }), (error: unknown) => error instanceof AnalysisError && error.code === 'AI_UNAVAILABLE');
  const captured = bodies.join('\n');
  assert.match(captured, /completionDiagnostics/);
  assert.match(captured, /"finishReason":"length"/);
  assert.match(captured, /"completionTokens":1200/);
  assert.match(captured, /"reasoningTokens":1199/);
  assert.match(captured, /"providerStatus":429/);
  assert(!captured.includes('PRIVATE_REASONING_FRAGMENT'));
  assert(!captured.includes('PRIVATE_PROVIDER_ERROR_WITH_KEY'));
});
