# Official-source research contract

Status: implemented and covered by injected-transport tests; deployment and live-provider verification are separate checks. Research is a reference lookup for a technician, separate from inventory approval, deterministic allocations and repository Review. A search does not approve compatibility, diagnose a fault, certify a repair, or execute a change.

## Request and response

`POST /api/analyze` accepts the strict object below through the existing same-origin, JSON-size, per-IP, global and concurrency guards. No login is required for this public prototype endpoint.

```json
{"action":"research","model":"Lenovo ThinkPad T480","question":"Where is the official hardware maintenance manual for this exact model? Identify matching documents and scope limitations only."}
```

`model` is a trimmed public hardware-model string of 2–100 characters; `question` is 10–280 characters. The combined search query is at most 400 characters. These are the only task fields sent to Tavily. No inventory, laptop passport, serial number, repository content, user identity or organization data is automatically included. Users must enter only public information.

The existing response envelope retains `meta.provider: "Nebius Token Factory"`, its configured inference model, elapsed time, optional metadata-only trace ID and tool events. Research adds one `tavily_search` event and this `data` variant:

```typescript
type ResearchResult = {
  kind: 'research';
  model: string;
  question: string;
  summary: string;
  findings: Array<{ text: string; sourceIds: string[] }>;
  uncertainties: string[];
  nextChecks: string[];
  sources: Array<{ id: string; title: string; url: string; excerpt: string }>;
  fetchedAt: string;
  search: {
    provider: 'Tavily';
    requestId?: string;
    resultCount: number;
    credits?: number;
    mode: 'keyless' | 'api-key';
  };
};
```

`ResearchResult` is exported from `lib/research.ts`. Source IDs are server assigned. Each returned finding must cite at least one existing source ID; unknown IDs, duplicate IDs within a finding, extra model fields, HTML and model-generated URLs fail validation. Links come only from accepted Tavily results. Citation validation proves that a reference exists, not that a language model interpreted it correctly. Excerpts are search snippets, not fetched or verified full documents.

References also pass conservative lexical model screening. The supplied model must contain an alphanumeric identifier (such as T480 or G5) or a one-to-four-digit model number (such as 5490 or 840); standalone years from 1900 through 2099 do not establish identity. Every identifier must appear as an exact normalized token in a title or excerpt. T480 never matches T480s. A title naming another model is not rescued by an incidental matching model in its excerpt, and recognized conflicting product families are rejected. Generic family-only or year-only inputs therefore abstain. This may omit useful documents with alternative naming conventions; it does not establish generation, revision, part compatibility or physical condition.

If no safe, usable sources remain, the endpoint returns an explicit abstention with empty findings and sources, and skips Nebius inference. In this case `meta.model` still identifies the configured model, not an executed completion. No synthetic evidence or fallback answer is supplied.

## Provider policy

The server calls only `https://api.tavily.com/search`, once, with no redirects or retries. A nonempty server-only `TAVILY_API_KEY` selects Bearer authentication. Otherwise an explicit `TAVILY_ACCESS_MODE=keyless` selects `X-Tavily-Access-Mode: keyless`. Missing configuration fails closed. Keyless availability and quotas are controlled by Tavily; this integration does not promise unlimited or permanent free access.

The fixed request uses `search_depth: "basic"`, `topic: "general"`, `max_results: 5`, `include_answer: false`, `include_raw_content: false`, `include_images: false`, `auto_parameters: false`, and `include_usage: true`. It applies a fixed official vendor support/documentation domain list both in the search request and independently to every returned URL. The implementation's exported `RESEARCH_DOMAINS` is the authoritative list. Sources with unsafe protocols, credentials, credential-like query parameters, nonstandard ports or domains outside that list are discarded. Accepted URLs are normalized HTTPS links; fragments are removed and duplicates collapsed.

Current domain coverage is Lenovo support/download/PSREF, Dell documentation, HP support, Apple support/manuals and Microsoft support/learn. A product outside this list may receive an empty result; the endpoint does not broaden its search silently. Snippets are limited to 1,200 characters and titles to 180 characters after HTML and control-character removal. Search `resultCount` counts accepted unique sources, not raw provider hits.

The Tavily deadline is 10 seconds including response headers and body reading. The body is streamed with a 128 KiB ceiling. The existing overall workflow deadline also applies. Provider failures return sanitized errors without query text, source content, credentials or provider response bodies. No automatic retry incurs an additional search or inference call.

With usable sources, the existing Nebius provider makes one schema-constrained synthesis completion. The model receives the two explicit public input fields and bounded plain-text source snippets, titles and existing URLs marked as untrusted data. It cannot search, choose response links, call another tool, approve inventory or execute repairs. Synthesis locates matching references and explains limitations; it must not reproduce electrical values, probing, disassembly, charging or replacement procedures. A conservative output check rejects common detailed electrical and battery-procedure patterns, but is not a comprehensive semantic safety verifier. All findings remain reference-only and require technician review.

## Configuration and errors

`GET /api/health` adds `tavilyConfigured: boolean` and `tavilyMode: "keyless" | "api-key" | "unconfigured"`. These are configuration flags, not provider health checks. Credentials are never returned.

Research uses existing `INVALID_INPUT`, `AI_NOT_CONFIGURED`, `AI_UNAVAILABLE` and `AI_RESPONSE_INVALID` errors plus `RESEARCH_NOT_CONFIGURED` (503), `RESEARCH_UNAVAILABLE` (502), and `RESEARCH_RESPONSE_INVALID` (502). Search failure never silently becomes an uncited AI answer. LangSmith receives only action/model/tool/status/count diagnostics; inputs, source snippets, responses and provider bodies are hidden.

The endpoint's existing limits are process-local: five accepted requests per IP per ten minutes, sixty requests per hour per instance, two active requests globally per instance and one per IP. Restarting or scaling instances resets or multiplies them. Tavily's optional reported credits are search usage, not a billing guarantee or a combined Nebius cost. Authenticated durable quotas and provider spending controls remain necessary for a production public service.

## Validation boundary

Automated tests use injected provider transports and perform no paid calls. They cover request bounds, exact Tavily options, API-key precedence, keyless opt-in, source allowlisting, unsafe links, HTML normalization, duplicate sources, empty-result abstention, citation rejection, prompt-injection containment, sanitized provider errors, response-body bounds and deadlines, plus metadata-only tracing. Deployment smoke checks and any live calls are separate operator actions.

The full release suite passes 249 tests, including `tests/research.test.ts` and `tests/api.test.ts`, plus TypeScript validation. A real connectivity smoke revealed unrelated Lenovo manuals and a misleading synthesis despite HTTP 200; the regression tests now reproduce that T480/ThinkPad 13/T500/X1 Nano/Edge pattern and require unrelated manuals to be discarded. A successful HTTP response alone is not answer-quality verification. Prompt-injection tests establish data separation, no model tools and fail-closed structured validation; they do not prove that a language model can never misinterpret hostile prose or make an unsupported textual claim.

Official references: [Tavily agent setup](https://tavily.com/agent-setup/SKILL.md), [official search skill](https://github.com/tavily-ai/skills/blob/main/skills/tavily-best-practices/references/search.md).
