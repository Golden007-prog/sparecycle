import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import OpenAI from 'openai';
import { Client } from 'langsmith';
import { AnalysisError, configuredModel, runAnalysis } from '../lib/ai.js';
import type { AnalysisInput, AnalysisResponse, CompletionProvider } from '../lib/ai.js';
import { sampleRecoveryBatch, defaultRecoveryLimits } from '../lib/recovery-data.js';
import { planRecovery } from '../lib/recovery.js';

// This opt-in script spends existing provider credits. It sends synthetic data
// only and never repeats a failed model request. At most six completions total.
const envFile = resolve('.env.local');
if (existsSync(envFile)) process.loadEnvFile(envFile);
const env = process.env;
if (!env.NEBIUS_API_KEY?.trim() || !env.LANGSMITH_API_KEY?.trim()) {
  console.log(JSON.stringify({ ok: false, code: 'MISSING_SERVER_CONFIGURATION' }));
  process.exit(1);
}

let suppressedSdkWarnings = 0;
// SDK background errors can include request details. Record only their count.
console.warn = () => { suppressedSdkWarnings += 1; };
console.error = () => { suppressedSdkWarnings += 1; };
const openai = new OpenAI({ apiKey: env.NEBIUS_API_KEY, baseURL: 'https://api.tokenfactory.nebius.com/v1/', timeout: 20_000, maxRetries: 0 });
const traceClient = new Client({
  apiKey: env.LANGSMITH_API_KEY, apiUrl: env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
  workspaceId: env.LANGSMITH_WORKSPACE_ID || undefined, timeout_ms: 4_000, callerOptions: { maxRetries: 0 },
});
const completions: Array<Record<string, unknown>> = [];
let paidAttempts = 0;
const provider: CompletionProvider = async request => {
  if (paidAttempts >= 6) throw new Error('Verification completion allowance exhausted.');
  paidAttempts += 1;
  const started = Date.now();
  try {
    const result = await openai.chat.completions.create(request);
    completions.push({
      attempt: paidAttempts, ok: true, latencyMs: Date.now() - started,
      finishReason: result.choices[0]?.finish_reason, usage: result.usage,
      toolNames: result.choices[0]?.message.tool_calls?.map(call => call.type === 'function' && ['list_inventory', 'inspect_device', 'compute_recovery_plan'].includes(call.function.name) ? call.function.name : 'unrecognized'),
    });
    return result as Awaited<ReturnType<CompletionProvider>>;
  } catch (error) {
    const status = error instanceof OpenAI.APIError ? error.status : undefined;
    completions.push({ attempt: paidAttempts, ok: false, latencyMs: Date.now() - started, status, code: 'PROVIDER_REQUEST_FAILED' });
    throw new Error('Provider verification request failed.');
  }
};

async function verifyTrace(response: AnalysisResponse) {
  if (!response.meta.traceId) return { delivered: false, code: 'NO_TRACE_ID' };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt) await new Promise(resolveDelay => setTimeout(resolveDelay, 1_000));
    try {
      const run = await traceClient.readRun(response.meta.traceId, { loadChildRuns: true });
      return {
        delivered: true, id: run.id, name: run.name, runType: run.run_type,
        completed: Boolean(run.end_time), inputsHidden: Object.keys(run.inputs || {}).length === 0,
        outputsHidden: Object.keys(run.outputs || {}).length === 0,
        children: run.child_runs?.map(child => ({ name: child.name, runType: child.run_type, metadata: child.extra?.metadata,
          inputsHidden: Object.keys(child.inputs || {}).length === 0, outputsHidden: Object.keys(child.outputs || {}).length === 0 })),
      };
    } catch { /* Retry trace reads only; never repeat inference. */ }
  }
  return { delivered: false, code: 'TRACE_NOT_CONFIRMED' };
}

const checks: Array<Record<string, unknown>> = [];
const fixtures: AnalysisInput[] = [
  { action: 'intake', text: 'Synthetic verification. Laptop A is a Dell Latitude 5490. The technician reports it needs one approved RAM-5490-8G module and estimates 25 repair minutes. Data wiping and final QA are still pending.' },
  { action: 'plan', batch: sampleRecoveryBatch, limits: defaultRecoveryLimits, brief: 'This is a synthetic demonstration. Inspect device-01, then compute the recovery plan and explain its resource trade-off. Do not claim completed repairs.' },
];
for (const fixture of fixtures) {
  try {
    const response = await runAnalysis(fixture, { provider });
    const trace = await verifyTrace(response);
    const planMatches = fixture.action !== 'plan' || JSON.stringify(response.plan) === JSON.stringify(planRecovery(fixture.batch, fixture.limits));
    checks.push({ action: fixture.action, ok: planMatches && trace.delivered, planMatches, response, trace });
    console.log(JSON.stringify({ action: fixture.action, modelSucceeded: true, traceDelivered: trace.delivered, planMatches, latencyMs: response.meta.latencyMs, tools: response.meta.tools }));
  } catch (error) {
    const failure = { action: fixture.action, ok: false, code: error instanceof AnalysisError ? error.code : 'VERIFICATION_FAILED', status: error instanceof AnalysisError ? error.status : undefined };
    checks.push(failure);
    console.log(JSON.stringify(failure));
  }
}
const evidence = { verifiedAt: new Date().toISOString(), model: configuredModel(), fixtureType: 'synthetic-only', paidAttempts, suppressedSdkWarnings, checks, completions };
mkdirSync('test-results', { recursive: true });
const evidencePath = 'test-results/live-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ ok: checks.every(check => check.ok), paidAttempts, evidencePath, suppressedSdkWarnings }));
if (!checks.every(check => check.ok)) process.exitCode = 1;
