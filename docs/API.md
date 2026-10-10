# SpareCycle API contract

All endpoints return JSON and disable response caching. Server credentials never reach the browser. `GET /api/health` returns `{aiConfigured:boolean,tracingConfigured:boolean,model:string,service:"SpareCycle"}`. Configuration flags do not verify provider connectivity.

`POST /api/analyze` requires `Content-Type: application/json`. Requests are limited to 24,000 UTF-8 bytes. Responses use `{data,plan?,meta}` or `{error,code}`. The optional `plan` is produced by the deterministic server planner, never copied from model output.

## Requests

- Intake: `{action:"intake",text:string}`. Text must contain 10–6,000 characters after trimming. Returns draft `{devices:[{label,model,needs:string[],repairMinutes:number|null,note,missing:string[]}],summary,missing:string[]}`. It extracts user assertions only. It does not diagnose a device, infer compatibility, or confirm wiping, safety or quality checks. A person reviews drafts before changing inventory.
- Plan: `{action:"plan",batch:RecoveryBatch,limits:RecoveryLimits,brief?:string}`. Optional brief is at most 2,000 characters. Validated batch and limits together must fit 16,000 UTF-8 bytes. See the browser-safe schemas in `lib/recovery-types.ts` for exact inventory fields, references and bounds.
- Explain: same batch, limits and optional brief as plan, with `action:"explain"`. It computes the server plan and requests one grounded explanation without the agent tool loop.

Plan and explain return `data:{summary:string,risks:string[],nextAction:string}` and `plan:RecoveryPlan`. Planning accepts at most 18 devices, 40 part records and 40 evidence records. `limits` contains `budgetCents`, `technicianMinutes`, and `unavailablePartIds`. Caller claims, part evidence and model text never override deterministic constraints.

## Agent tools and bounds

The plan workflow exposes only `list_inventory({})`, `inspect_device({deviceId})` and `compute_recovery_plan({})`. Inputs are strict, identifiers must be in the submitted batch, and all tools are read-only. The model can choose at most three tool rounds and six total calls. If it has not called the planner, the final tool round requires `compute_recovery_plan`. A final structured response explains the independently returned plan. The complete workflow has a 55-second budget, each completion at most 20 seconds, with no provider retries. A timeout or invalid model result fails explicitly; no simulated AI fallback is returned.

`meta` contains `{provider:"Nebius Token Factory",model,latencyMs,traceId?,tools:[{name,status:"completed"|"rejected",resultCount}]}`. This lists actual operations. LangSmith traces contain operation names/counts and configuration metadata only, not inventory, notes, prompts, tool arguments or outputs. Trace delivery is attempted with a bounded two-second flush. A trace ID is a correlation identifier, not proof that remote delivery succeeded.

## Errors and deployment limits

`400 INVALID_INPUT`: invalid schema, unknown reference, unsafe object key, malformed or oversized JSON. `403 ORIGIN_NOT_ALLOWED`: foreign browser origin. `405 METHOD_NOT_ALLOWED`: wrong method. `429 RATE_LIMITED`: per-process quota/concurrency exceeded. `503 AI_NOT_CONFIGURED`: server key missing. `502 AI_UNAVAILABLE` or `AI_RESPONSE_INVALID`: provider, timeout, malformed output or invalid tool call. Raw provider errors are not exposed.

Requests without an Origin header work for CLI clients. Browser origins must match `APP_ORIGIN` when configured, otherwise the request host. Demo throttling is five requests/IP/10 minutes, 60 requests/hour and two concurrent requests per process, at most one per IP. These in-memory limits reset on restart and do not coordinate between serverless instances; they are not a durable spend-control system. Production needs authentication and shared quotas.

Local development loads `.env.local`. Set `NEBIUS_API_KEY`; optionally configure `NEBIUS_MODEL`, `LANGSMITH_API_KEY`, `LANGSMITH_TRACING`, `LANGSMITH_PROJECT`, `LANGSMITH_WORKSPACE_ID`, `LANGSMITH_ENDPOINT`, and `APP_ORIGIN`. LangSmith organization and workspace IDs are distinct. Vercel functions need a 60-second execution allowance. Inventory stays in each request; this API does not persist or modify it.
