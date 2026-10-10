# SpareCycle Review verification harness

The first verification profile, `node-diagnostics-v1`, repairs one pure JavaScript parser under `src/diagnostics/*.mjs`. It reads one to eight unchanged `tests/diagnostics/*.test.mjs` files. It does not execute an arbitrary repository build, install dependencies, modify tests, change workflow files, merge a PR, or administer laptops.

## Evidence and execution boundaries

1. The server checks organization membership and loads the change, evidence version, project binding, and worker checkpoint. Browser-supplied approvals and test results are not authoritative.
2. A repository snapshot pins its Git commit, tree, regular non-executable source/test blobs, contents, and SHA-256 digest. Source, evidence, comments and tests are untrusted model input. They cannot grant tools or permissions.
3. Nebius Token Factory returns a strict JSON investigation. Software findings can proceed to patch generation. Hardware and insufficient-evidence findings require technician work.
4. A separate Nebius request proposes one complete parser replacement. A shared Acorn AST policy permits a conservative subset of pure parser functions and local computation. It rejects ambient globals, computed property access except safe literal keys, prototype/constructor traversal, dynamic evaluation, indirect expression calls, member assignment, unsupported syntax and dependency changes. Both the API and trusted runner apply this policy. It is not a substitute for execution isolation.
5. An isolated runner tests the original source and the proposed source against the same unchanged test files. An accepted proof requires an actual failing baseline, a passing candidate, equal total test counts, no skipped/cancelled tests and matching source/patch/evidence/image identities. It also compares a digest of all reported subtest names, nesting and order; equal summary counts cannot substitute a successful file wrapper for the original named tests.
6. A fresh model request reviews the patch without the writer's conversation history. A different human reviewer then approves that exact patch and evidence version. Model agreement alone never authorizes publication.
7. A short-lived GitHub App token restricted to the selected repository publishes a draft branch and PR. The default branch is checked again immediately before publication. GitHub provides no atomic PR/default-head condition; the draft still requires repository review. A matching partially published branch can be resumed only after GitHub's comparison proves its single changed blob equals the tested candidate. Conflicting branches are never overwritten.

The source SHA, evidence digest and candidate digest invalidate old proof and approval when their inputs change. A merged software PR is not a physical repair certificate.

## Model routing

| Tier | Exact Nebius model ID | Default role |
| --- | --- | --- |
| Nano | `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` | Optional economical investigation |
| Lightning | `nvidia/Nemotron-3_5-Lightning` | Investigation and independent model review |
| Super | `nvidia/nemotron-3-super-120b-a12b` | Parser patch proposal |
| Ultra | `nvidia/Nemotron-3-Ultra-550b-a55b` | Explicit escalation; requires `NEBIUS_REVIEW_ALLOW_ULTRA=true` |

All model requests use `https://api.tokenfactory.nebius.com/v1/`. A stage makes one bounded inference request with no provider retries and no alternate AI provider. The maximum output budget is 4,096 tokens for investigation/review and 8,192 for a patch; the time budget is 40 seconds. Every stage reserves 120,000 input tokens: at most 100 KB of UTF-8 context plus a 20,000-token allowance for instructions, schema and framing. This accounts for multibyte evidence rather than relying on character counts. Provider-reported usage beyond the reserved bounds produces an explicit reconciliation error. Lightning disables thinking through its supported chat-template option; that option is not assumed compatible with other models. Price-based reservations are conservative estimates, not billing receipts. Availability is checked by actual responses; the model catalog does not demonstrate quality or successful inference.

LangSmith receives operation names, model IDs and harness metadata with input/output capture disabled. Private evidence, source, prompts, generated code, provider errors and credentials are excluded. Provider error messages are sanitized before the tracing boundary. LangSmith is observability; Nebius performs the inference.

## Nebius Sandboxes adapter

Set server-only `NEBIUS_API_KEY`, `NEBIUS_PROJECT_ID`, and `NEBIUS_SANDBOX_IMAGE_ID`. The image must be an immutable UUID with Node.js 22 or later at `/usr/local/bin/node`. Sandboxes is a separately activated project capability; an inference key or a simulated console playground does not prove access.

The REST adapter uses `https://api.tokenfactory.nebius.com/sandboxes/v1` with `Authorization` and `Project` headers. `probe()` reads the image catalog. `startVerification()` uploads bounded files and submits one operation; `pollVerification()` performs one status request. Store each returned receipt before polling or progressing. Upload hashes, image identity, file bindings, guest flags and terminal process state are checked before accepting TAP output.

Every verification operation explicitly uses `networking.enabled=false`, `shell=false`, a non-root guest UID, read-only injected files, a 30-second guest timeout, bounded output/layer size and `disposable=true`. No API, GitHub or database credentials enter the guest. Cancellation accepts a server-owned receipt; it does not claim termination until the remote status confirms it. Unknown submission outcomes require inspection before retry, because the API does not provide a documented idempotency key for instance creation.

If project access is missing, the adapter returns an explicit unavailable result. It never reports simulated tests as passed.

## Public-source GitHub Actions pilot adapter

Where Nebius Sandboxes activation is unavailable, the isolated verification provider can be **GitHub Actions isolated container**. This designation is stored in the proof and appears in the draft PR. Nebius remains the AI inference provider. The shared Actions runner accepts only repositories explicitly marked public, checked again against GitHub immediately before dispatch. It does not support private enterprise repositories.

Server configuration:

```
GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY
REVIEW_ACTIONS_REPOSITORY=Golden007-prog/sparecycle
REVIEW_ACTIONS_REPOSITORY_ID=<numeric repository ID>
REVIEW_ACTIONS_INSTALLATION_ID=<installation containing the runner>
REVIEW_ACTIONS_REF=<reviewed branch or tag>
REVIEW_ACTIONS_SHA=<exact 40-character verifier commit>
REVIEW_ACTIONS_IMAGE=node:22-alpine@sha256:2c752226d477b4a886378baa95b9af252be59301b725fdb0b7e15208131505a8
```

The App needs Actions write permission for dispatch and read permission for polling/artifacts on the runner. Each minted token requests exactly that one repository. Source repository publication uses a separate token with contents/PR permissions and no Actions permission.

`createActionsRunner().startActionsVerification(snapshot,candidate,evidenceHash)` returns a durable receipt containing a run ID, random correlation nonce, payload hash, pinned verifier SHA, workflow identity and input hashes. `pollActionsVerification(receipt)` verifies the run's repository, exact commit, workflow path/ID, dispatch event, nonce and first attempt before inspecting a small metadata-only proof artifact. Source, test output, raw laptop evidence and model rationale are excluded from artifacts and runner logs. The download does not forward GitHub credentials to artifact storage; ZIP contents and sizes are restricted.

The checked-in workflow uses commit-pinned checkout and artifact actions. It installs only the exact Acorn 8.19.0 parser on the trusted host with package scripts disabled. The trusted runner script never invokes a shell with payload content. It prepares the digest-pinned Node image, then runs baseline and candidate in separate Docker containers with no guest networking, dropped capabilities, no-new-privileges, read-only filesystem, read-only source mount, non-root user, bounded CPU/memory/processes, short timeout and no host secrets. Containers and temporary files are removed after verification. Docker isolation is a constrained pilot boundary, not a claim of certified tenant isolation or VM equivalence.

Public PR titles and commit messages are generated from the allowlisted parser filename. The PR body contains verification metadata only. Private organization case titles, laptop evidence, model rationale and risk narrative are never copied into GitHub. The explicitly reviewed patch itself is the only model-generated content published.

The API should execute one persisted stage or short poll per request. Snapshot collection, model generation, remote submission, remote polling, model review and publication must not be combined into one 60-second serverless request. Changing a runner pin requires administrator review; a floating workflow branch alone is insufficient.

## GitHub connection

`discoverRepository(installationId,ownerSlashRepo,userToken)` checks the connecting person's repository write permission with a one-time App user token or fine-grained token. It independently mints an App installation token restricted to the discovered repository ID and checks that installation can access the same repository. This prevents an organization member from linking arbitrary installation IDs. Do not store or log the one-time user token. Webhooks use constant-time HMAC comparison over exact raw request bytes; event replay deduplication belongs in the durable event store.

## Validation and limits

Automated unit/integration tests cover routing, structured output, timeouts, trace privacy, patch scope, source/evidence hashes, independent approvals, GitHub token scoping, stale heads, draft-only publishing, sandbox flags/provenance, actual test-summary requirements, private-source rejection, pinned Actions run identity and artifact integrity. Mock transport tests verify adapter behavior; they do not establish that a user's account has live Sandbox/App access. Live model calls and real runner executions must be recorded separately.

This release is a reviewable public-source pilot. Enterprise private-code execution, customer-specific isolated workers, SSO provisioning, enterprise retention guarantees, fleet-wide rollback, hardware-in-loop validation and compliance certification require separate deployment work and evidence.

## Primary references

- [Nebius Sandbox access and activation](https://docs.tokenfactory.nebius.com/sandboxes/start/set-up-access)
- [Nebius instance REST schema](https://docs.tokenfactory.nebius.com/api-reference/sandboxes/instances/spawn-a-new-container-instance)
- [Nebius offline verification recipe](https://docs.tokenfactory.nebius.com/sandboxes/cookbook/verify-with-networking-disabled)
- [GitHub App installation tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [GitHub workflow dispatch API](https://docs.github.com/en/rest/actions/workflows?apiVersion=2026-03-10#create-a-workflow-dispatch-event)
- [GitHub artifact API](https://docs.github.com/en/rest/actions/artifacts?apiVersion=2026-03-10#download-an-artifact)
