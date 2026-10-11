import { z } from 'zod';
import type { ReviewAction } from './types.js';

export const REVIEW_MAX_BODY_BYTES = 32 * 1024;
const id = z.string().uuid();
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const organizationId = id;
const sourcePath = text(1, 160).regex(/^src\/diagnostics\/[A-Za-z0-9_-]+\.mjs$/);
const testPath = text(1, 160).regex(/^tests\/diagnostics\/[A-Za-z0-9_-]+\.test\.mjs$/);
export const reviewActionSchemas = {
  organizations: z.object({ action: z.literal('organizations') }).strict(),
  createOrganization: z.object({ action: z.literal('createOrganization'), name: text(2, 80) }).strict(),
  overview: z.object({ action: z.literal('overview'), organizationId }).strict(),
  createLaptop: z.object({ action: z.literal('createLaptop'), organizationId, assetTag: text(1, 80), manufacturer: text(1, 80), model: text(1, 120), operatingSystem: text(1, 100) }).strict(),
  addEvidence: z.object({ action: z.literal('addEvidence'), organizationId, laptopId: id, kind: z.enum(['technician_note', 'diagnostic_log', 'test_result']), content: text(10, 8000), source: text(1, 160) }).strict(),
  connectProject: z.object({ action: z.literal('connectProject'), organizationId, repository: text(3, 200).regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/), installationId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), targetPath: sourcePath, testPaths: z.array(testPath).min(1).max(4), githubUserToken: text(20, 300).regex(/^[A-Za-z0-9_-]+$/) }).strict(),
  createChange: z.object({ action: z.literal('createChange'), organizationId, laptopId: id, projectId: id.nullable(), title: text(5, 160), description: text(10, 2000), modelTier: z.enum(['nano', 'lightning', 'super', 'ultra']) }).strict(),
  runJob: z.object({ action: z.literal('runJob'), organizationId, changeId: id, stage: z.enum(['investigate', 'patch', 'verify', 'review', 'publish']), idempotencyKey: id }).strict(),
  resumeJob: z.object({ action: z.literal('resumeJob'), organizationId, jobId: id }).strict(),
  cancelJob: z.object({ action: z.literal('cancelJob'), organizationId, jobId: id }).strict(),
  approveChange: z.object({ action: z.literal('approveChange'), organizationId, changeId: id, evidenceVersion: z.number().int().nonnegative().max(1_000_000), baseCommit: z.string().regex(/^[a-f0-9]{40}$/), patchHash: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  createInvite: z.object({ action: z.literal('createInvite'), organizationId, role: z.enum(['admin', 'reviewer', 'technician', 'viewer']) }).strict(),
  redeemInvite: z.object({ action: z.literal('redeemInvite'), token: text(20, 500).regex(/^[A-Za-z0-9_-]+$/) }).strict(),
  setBudget: z.object({ action: z.literal('setBudget'), organizationId, monthlyBudgetCents: z.number().int().min(0).max(10_000) }).strict(),
};
export const reviewActionSchema: z.ZodType<ReviewAction> = z.discriminatedUnion('action', [
  reviewActionSchemas.organizations, reviewActionSchemas.createOrganization, reviewActionSchemas.overview,
  reviewActionSchemas.createLaptop, reviewActionSchemas.addEvidence, reviewActionSchemas.connectProject,
  reviewActionSchemas.createChange, reviewActionSchemas.runJob, reviewActionSchemas.resumeJob,
  reviewActionSchemas.cancelJob, reviewActionSchemas.approveChange, reviewActionSchemas.createInvite,
  reviewActionSchemas.redeemInvite, reviewActionSchemas.setBudget,
]);

/** Generate the distributable contract from the same schemas that reject runtime input. */
export function reviewOpenApiDocument() {
  const actionComponents = Object.fromEntries(Object.entries(reviewActionSchemas).map(([name, schema]) => {
    const { $schema: _dialect, ...json } = z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'input' });
    return [name, json];
  }));
  const response = { type: 'object', required: ['data', 'requestId'], additionalProperties: false, properties: { data: { description: 'Action result: organization/list, overview, created or updated record, job, or invitation. See the action result mapping in x-action-results.' }, requestId: { type: 'string', format: 'uuid' } } };
  const error = { type: 'object', required: ['error', 'code', 'requestId'], additionalProperties: false, properties: { error: { type: 'string' }, code: { type: 'string' }, requestId: { type: 'string', format: 'uuid' } } };
  const failure = (description: string) => ({ description, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewError' } } } });
  return {
    openapi: '3.1.0', info: { title: 'SpareCycle Review API', version: '2.0.0', description: 'Organization-scoped laptop evidence and recovery change review. Every POST uses a live Supabase user session. Project ownership, membership, roles, quota, job state and independent approvals are enforced server-side. The Node diagnostics profile restricts changes to src/diagnostics/*.mjs and existing tests/diagnostics/*.test.mjs.' },
    servers: [{ url: 'https://sparecycle-topaz.vercel.app' }, { url: 'http://localhost:3000', description: 'Local development' }],
    paths: { '/api/review': {
      get: { operationId: 'getReviewConfiguration', summary: 'Read public connection configuration', security: [], responses: { '200': { description: 'Public URLs, publishable auth key and configured service flags. No server credentials or live connectivity claims.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewConfig' } } } } } },
      post: { operationId: 'executeReviewAction', summary: 'Perform an authenticated organization action', security: [{ SupabaseUserSession: [] }], description: 'JSON only, at most 32 KiB. Unknown properties are rejected. No browser-supplied role, test result, approval result or model output is accepted. A missing Origin is allowed for authenticated non-browser clients; browser origins must match APP_ORIGIN or the request host. Responses are private and never cached.', requestBody: { required: true, content: { 'application/json': { schema: { oneOf: Object.keys(actionComponents).map(name => ({ $ref: `#/components/schemas/${name}` })), discriminator: { propertyName: 'action' } }, examples: { organizations: { value: { action: 'organizations' } }, createOrganization: { value: { action: 'createOrganization', name: 'Recovery pilot' } }, createChange: { value: { action: 'createChange', organizationId: '11111111-1111-4111-8111-111111111111', laptopId: '22222222-2222-4222-8222-222222222222', projectId: null, title: 'Intermittent fan noise at intake', description: 'The reported noise has not yet been reproduced. Collect diagnostics before proposing a repair.', modelTier: 'lightning' } } } } } }, responses: { '200': { description: 'Successful action, with a request identifier.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewResponse' } } } }, '400': failure('Invalid JSON, input schema or bounded path.'), '401': failure('Missing, expired or invalid session.'), '403': failure('Disallowed origin, missing membership or insufficient role.'), '404': failure('Record or invitation is unavailable to this caller.'), '405': failure('Use GET or POST.'), '409': failure('Stale evidence, conflicting job state or unmet review requirement.'), '429': failure('Organization budget or service quota is exhausted.'), '500': failure('Unexpected internal failure; raw provider errors are not returned.'), '502': failure('An upstream integration did not complete safely.'), '503': failure('Required integration or database is not configured or available.'), '504': failure('A bounded upstream operation exceeded its deadline.') }, 'x-action-results': { organizations: 'ReviewOrganization[]', createOrganization: 'ReviewOrganization', overview: 'ReviewOverview', createLaptop: 'LaptopPassport', addEvidence: 'LaptopEvidence', connectProject: 'ReviewProject', createChange: 'RecoveryChange', runJob: 'ReviewJob', resumeJob: 'ReviewJob', cancelJob: 'ReviewJob', approveChange: 'RecoveryChange', createInvite: '{token:string,expiresAt:date-time}', redeemInvite: 'ReviewOrganization', setBudget: 'ReviewOrganization' } },
    } },
    components: {
      securitySchemes: { SupabaseUserSession: { type: 'http', scheme: 'bearer', bearerFormat: 'Supabase user JWT', description: 'A signed-in user access token. Never use a service-role or provider API key.' } },
      schemas: { ...actionComponents, ReviewError: error, ReviewResponse: response, ReviewConfig: {
        type: 'object', required: ['version', 'authConfigured', 'supabaseUrl', 'supabasePublishableKey', 'githubConfigured', 'githubInstallUrl', 'nebiusConfigured', 'sandboxConfigured', 'models', 'limitations'],
        properties: {
          version: { const: '2' }, authConfigured: { type: 'boolean' },
          googleSignInEnabled: { type: 'boolean', description: 'Operator-enabled Google OAuth login option. Requires Supabase Auth configuration; not a live provider check or managed enterprise SSO claim.' },
          ssoProvider: { type: ['object', 'null'], description: 'Optional custom OIDC login choice; not SSO enforcement, automatic membership or a live IdP test.', required: ['id', 'label'], additionalProperties: false, properties: { id: { type: 'string', pattern: '^custom:[a-z0-9][a-z0-9:-]*$', maxLength: 50 }, label: { type: 'string', minLength: 1, maxLength: 48 } } },
          supabaseUrl: { type: ['string', 'null'], format: 'uri' }, supabasePublishableKey: { type: ['string', 'null'], description: 'Publishable or legacy anon key only; never a secret/service key.' },
          githubConfigured: { type: 'boolean' }, githubInstallUrl: { type: ['string', 'null'], format: 'uri' }, nebiusConfigured: { type: 'boolean' }, sandboxConfigured: { type: 'boolean' }, runnerConfigured: { type: 'boolean' },
          models: { type: 'array', items: { type: 'object', required: ['tier', 'id', 'label'], properties: { tier: { enum: ['nano', 'lightning', 'super', 'ultra'] }, id: { type: 'string' }, label: { type: 'string' } } } },
          limitations: { type: 'array', items: { type: 'string' } }
        }
      } }
    },
  };
}
