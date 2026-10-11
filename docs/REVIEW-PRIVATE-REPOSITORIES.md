# Private repositories in SpareCycle Review

Private diagnostic projects use a verifier inside the **same private GitHub repository** as their source. They never use SpareCycle's shared public verification workflow. Nebius Token Factory still performs investigation, patch generation and the separate model review. A different organization member must approve the tested change before the GitHub App creates a draft PR.

The company connection API supports one pure JavaScript parser under `src/diagnostics/*.mjs` and one to four unchanged test files under `tests/diagnostics/*.test.mjs`. Individual files may contain multiple test cases. It does not yet run arbitrary application builds, install project dependencies, merge PRs or administer laptops. Private repository support is not a claim of compliance certification or general code-agent access.

## Connect a company project

1. **Select the repository.** Its GitHub administrator installs SpareCycle Review with access to only the intended private repository. The App needs Contents, Pull requests and Actions read/write, plus Metadata read. The person connecting it must separately prove repository write access with the one-time credential in the project connection form; that credential is not retained. Organization membership alone cannot connect someone else's repository.
2. **Install the verifier.** Put `.github/workflows/review-private-verify.yml` and the four scripts listed below on the repository's default branch. Review that commit, keep a branch or tag pointing to it, and record the exact 40-character commit SHA. Protect the verifier reference and workflow changes with the organization's repository controls. The service rejects a moved pin; it does not silently accept a new verifier.
3. **Add the transport key.** Generate a dedicated RSA key pair of 3,072 or 4,096 bits. Store the private PKCS#8 PEM as the repository's Actions secret named `SPARECYCLE_REVIEW_PRIVATE_KEY`. Supply only its public SPKI PEM to the SpareCycle operator. This is a separate key from the SpareCycle GitHub App signing key. Never put the transport private key in source, frontend settings, dispatch inputs, chat or the public runner.
4. **Bind the organization.** The SpareCycle operator adds an exact organization/repository/installation/pin/public-key binding to the server-only `REVIEW_PRIVATE_RUNNERS_JSON` setting, then redeploys. This explicit operator step prevents another organization from choosing an arbitrary runner. The connection check reads GitHub to verify repository identity, current private visibility and the pinned workflow before enabling the project.
5. **Run a controlled case.** Connect the project, attach bounded laptop evidence, investigate with Nebius, propose the patch, and run verification. Confirm that the original tests fail and the same named tests pass with the candidate. Complete the independent model review and a separate member's approval, then create the draft PR. Keep the first case synthetic until the organization has accepted the actual evidence and data flow.

The trusted file bundle is:

```
.github/workflows/review-private-verify.yml
scripts/review-verify.mjs
scripts/review-parser-policy.mjs
scripts/review-integrity.mjs
scripts/review-private-payload.mjs
```

The dispatch workflow must exist on the default branch even when execution uses a separate pinned reference. Its checked-in job runs on a fresh GitHub-hosted Ubuntu runner and uses commit-pinned checkout and upload-artifact actions. It prepares only Acorn 8.19.0 on the trusted host, with package installation scripts disabled.

## Server configuration

Existing server-only `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `NEBIUS_API_KEY`, Supabase settings and Review worker settings remain required. Add a JSON array to `REVIEW_PRIVATE_RUNNERS_JSON`; this example contains placeholders:

```json
[
  {
    "organizationId": "<SpareCycle organization UUID>",
    "repository": "<GitHub owner>/<private repository>",
    "repositoryId": 123456789,
    "installationId": 123456,
    "ref": "review-verifier-v1",
    "sha": "<exact approved 40-character commit SHA>",
    "image": "node:22-alpine@sha256:2c752226d477b4a886378baa95b9af252be59301b725fdb0b7e15208131505a8",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n<public key only>\n-----END PUBLIC KEY-----\n"
  }
]
```

Use actual numeric GitHub IDs, not installation URLs or repository names, for the two ID fields. Up to 20 explicit bindings are supported. A duplicate organization/repository binding, malformed configuration, weak key, private PEM, changed reference or mismatched installation fails closed. When rotating the key, install its matching private repository secret and public server binding together; existing receipts need fresh verification because the binding digest changes.

The public `REVIEW_ACTIONS_*` settings do not authorize private projects and are not a fallback for a missing private binding. No private code is sent to the public workflow if setup is incomplete.

## What crosses each boundary

| Destination | Data it receives |
| --- | --- |
| SpareCycle server and organization-isolated storage | The bounded source/test snapshot, candidate, evidence and saved job state needed for the selected case |
| Nebius Token Factory | Bounded evidence and code needed for the selected AI stage; the organization must approve this model-provider processing |
| LangSmith | Operation and model metadata, with prompts, source, generated code, evidence and credential capture disabled |
| The same private GitHub repository's dispatch API | An authenticated encrypted envelope, correlation nonce and routing identifiers; no plaintext source or tests |
| The private GitHub-hosted verifier | Decrypted bounded files in temporary storage, tested inside restricted containers; no App, Supabase or Nebius credentials enter the containers |
| The private proof artifact | Hashes, identities, counts, execution metadata and timestamps; no plaintext source, evidence, test names, stdout or stderr |
| The private draft PR | The explicitly reviewed parser patch and verification metadata; no private case title, laptop evidence or model rationale |

The envelope uses a fresh AES-256-GCM key and nonce, wrapping the key with RSA-OAEP-SHA256. Its authenticated context binds organization, repository ID, installation ID, exact verifier commit, key fingerprint and request nonce. It is limited to 60 KB, below GitHub's dispatch input limit. Encryption authenticates integrity and the recipient context; it is not a substitute for GitHub installation access or the server's stored request identity.

Decryption requires the private repository's Actions secret. The trusted entry point verifies GitHub's event, repository ID and private flag, first attempt, GitHub-hosted environment, commit and workflow commit before decrypting. Baseline and candidate run in separate containers with networking disabled, read-only filesystem/source mounts, non-root user, dropped capabilities, limited CPU/memory/processes and bounded execution/output. Source and test output are not emitted to logs. Temporary files and named containers are removed after execution. The private workflow retains only `proof.json`, for one day.

The API accepts a proof only when it matches the original stored receipt, organization binding, ciphertext hash, workflow identity, repository, installation, immutable commit, source/patch/evidence hashes and unchanged named-test digest. It rechecks private visibility during dispatch, polling and publication. GitHub does not offer an atomic visibility-and-write transaction: repository administrators remain responsible for retaining private visibility and controlling workflow edits. Making the repository public exposes the repository itself independently of SpareCycle.

## Validation and operational limits

Automated checks cover encrypted payload tampering, wrong keys, wrong organizations, changed installations, moved pins, private-to-public changes, metadata-only proof acceptance, output redaction after decryption, scoped GitHub App tokens and draft-only publication. Transport mocks prove rejection behavior; they do not establish that a customer's Actions secret, quota or repository setup works. Record a successful real private workflow and resulting draft PR separately before describing that customer's integration as verified.

The connection probe cannot read or validate GitHub's secret value. A missing or mismatched secret therefore fails when the real verifier starts. Actions availability, runner minutes, repository policies and account billing remain GitHub controls; the integration does not enable paid usage, buy capacity or modify those policies. The organization must separately establish its retention, access, email/SSO, audit and compliance requirements.

Cancelling a saved Review job prevents it from advancing in the application; it does not terminate a GitHub Actions run that has already started. Inspect GitHub for in-flight execution or an uncertain publication result before intentionally retrying a failed stage. No stage is retried automatically to obtain a passing result.

## Recorded private pilot verification

On **11 October 2026**, a real workflow in the private synthetic repository `Golden007-prog/sparecycle-private-pilot` completed encrypted dispatch, decryption and isolated baseline/candidate execution. Nebius Nano supplied the software investigation and Nemotron Super generated the proposed parser fix. The baseline had **one failing test**; the candidate passed **all four unchanged tests**. No real customer code or physical laptop diagnosis was used.

- Change: `9307d8bd-a0b3-45bb-9cff-46c68690663e`.
- Approved verifier/base commit: `9680ba981d7d2b8ab9a269d7d21b56fa9e2dc0f5`.
- Candidate SHA-256: `7c833a76d95f106ba49fec039e363d394ca10534a75eb2722086d047d0e934fd`.
- Evidence SHA-256: `447d28cb5466103612cac02d3d0c6ac645a33b8bddf977f4a05d458aba03994c`.
- Verification completed: `2026-10-11T03:29:04.753Z`.
- Real private workflow: [run 38108505583](https://github.com/Golden007-prog/sparecycle-private-pilot/actions/runs/38108505583).
- Resulting private draft: [PR #1](https://github.com/Golden007-prog/sparecycle-private-pilot/pull/1), head `fdf480c2cc9e2d8c6b40cff0c062727bc7ae1f5c`. These private links require repository access.

Nemotron Super completed the independent model review. The requesting synthetic owner account was denied self-approval; a distinct synthetic reviewer account then approved the exact case before publication. An unrelated synthetic account could not read the organization. These exercise account separation; they are not an actual employee's review decision.

A read-only audit at `2026-10-11T03:37:09.707Z` independently downloaded the private run's logs and proof into memory. The artifact contained exactly one metadata-only `proof.json`. Its repository/installation, pinned commit, ciphertext, snapshot, candidate, evidence and named-test bindings matched the recorded case. No exact baseline/test source, candidate source, or known credential strings checked by the audit appeared in the logs or proof. Raw archive contents were not written to disk. This check is scoped to the inspected run and known strings, not an assurance about every future log or credential.

The draft changed exactly one parser file; the unchanged test file retained its original Git blob SHA. The draft candidate's canonical digest matched the tested candidate. This establishes the real controlled private workflow through draft publication. Production deployment evidence and broader release checks remain separately recorded in [VALIDATION.md](VALIDATION.md).

Primary references: [GitHub workflow dispatch](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), [GitHub runner variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables), [installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app).
