# Judge access: verified account setup and operator instructions

Provisioned with explicit user approval on **11 October 2026**. A separate verification at **05:28 UTC** confirmed fresh password sign-ins for both dedicated accounts, their exact technician/reviewer roles, the single approved project, and rejection of access to the original integration organization. One synthetic passport, evidence record and unexecuted change are ready. The approved plan and its hash were preserved; no model/runner job, PR, budget increase or permission expansion was performed.

This document contains no credentials. The local setup script and its private outputs are ignored under `test-results/`. The private judge kit contains only the two dedicated account instructions and the public project dossier; it excludes source, environment files, operator credentials and provider keys. Access verification does not establish that a complete new judge workflow has executed successfully.

The kit was **delivered privately to Devpost on 11 October 2026**. The saved Additional information form confirmed `Current File: sparecycle-private-judge-kit.zip` in its judges-and-organizers-only area, which explicitly states that it does not appear on the public project page. This confirms private delivery of the testing instructions; it does not establish final submission or execution of a new judge workflow.

## Approved access

Use a **separate judge organization**, with the existing operator-controlled account as its owner. Create two new confirmed synthetic Supabase Auth accounts: one **technician**, one **reviewer**. Do not share the original integration owner/reviewer accounts, personal Google/GitHub accounts or provider/API credentials.

| Item | Exact approved scope |
| --- | --- |
| Application | `https://sparecycle-topaz.vercel.app/review` |
| Organization | A uniquely named `SpareCycle Judges <suffix>` organization, separate from the recorded integration pilot |
| Technician | Create synthetic passports, evidence and changes; run supported stages; publish a draft after another permitted account's approval |
| Reviewer | The same preparation/stage capabilities, plus approval of another account's exact tested change |
| Operator | Retains owner; organization budget, invitations and repository connection are not granted to the judge accounts |
| Project | Existing public `Golden007-prog/sparecycle`, App installation `169831969`; no new App installation or repository permissions |
| Source | Only `src/diagnostics/battery.mjs`, with unchanged `tests/diagnostics/battery.test.mjs` |
| Seed | One synthetic laptop passport, one versioned test observation and one unexecuted Nano change describing the zero-percent parser regression |
| Publication | The existing server creates draft PRs in that public synthetic repository after tests/model review/separate-account approval. No merge, default-branch edit, deployment or real laptop update |
| Provider cost | Existing operator-funded Nebius credits and current durable Review limits; no subscription or credit purchase, no automatic budget increase |

These roles are not globally read-only: an authenticated user can create up to three organizations and become owner there under the current application policy. The judge accounts cannot connect an arbitrary repository without independently proving GitHub write permission. They receive no GitHub token or App signing key. Sharing two dedicated test accounts demonstrates account separation, not proof of two independent humans reviewing a change.

## External actions completed under the approved plan

The approved apply step completed the following actions, followed by an independent read-only verification:

1. Verify the deployed app identifies the expected Supabase project and authenticate the operator.
2. Create exactly two new synthetic `example.test` email/password Auth users with per-user confirmation enabled. This sends no email and does not disable email confirmation or change global Auth settings.
3. Create the separate judge organization with the operator as owner.
4. Issue and immediately redeem one single-use invitation for each new account, granting only technician and reviewer respectively.
5. Connect the already-approved public synthetic repository to that new organization. A one-time credential from the operator's already-authenticated GitHub CLI is sent only to the trusted production Review endpoint for its access check; it stays out of saved files and judge instructions.
6. Create the synthetic passport, evidence and unexecuted change through normal authenticated Review APIs.
7. Verify both sign-ins, exact roles/project access and rejection when either judge account requests the original integration organization.

The script does **not** run model or Actions jobs, create a PR, change an App grant, modify the original organization, apply a database migration, alter SMTP/SSO, increase a budget or publish credentials. A live judge flow and its resulting public draft require a separate deliberate test after access setup.

## Available provisioning route

At preparation time, no Supabase-named connector tools were exposed in the session tool inventory. This is an availability observation, not a claim that the connector has been reconnected or authorized. The existing validated integration script uses a local operator-only Auth admin credential in `test-results/supabase-qa-secret.txt`. The prepared judge tool uses that credential only for creating the two confirmed synthetic users; all organization, invitation, project and evidence work goes through `/api/review` under ordinary user sessions.

The operator credentials are read from the existing ignored `test-results/review-live-fixture.json`; neither that fixture nor its organization is modified. Application/Auth configuration is read from `.env.local`. Session access tokens remain in memory. The application runtime still does not receive an Auth admin key through this setup.

If a usable Supabase connector becomes available, prefer its supported account-provisioning operation where applicable; its exact API must be inspected first. Do not replace RLS or direct-write protections to make provisioning easier. If the local admin credential is invalid, stop and arrange a supported provisioning route; do not print it or copy it into client configuration.

## Local preparation and explicit application

From the repository root:

```text
node test-results/judge-setup.mjs plan
node test-results/judge-setup.mjs prepare
node --test test-results/judge-setup.test.mjs
node test-results/judge-setup.mjs status
```

`plan` makes no external calls. `prepare` makes no external calls and writes fresh judge credentials plus an immutable, hashed setup plan. Repeating it preserves the same credentials and plan. Mocked tests exercise the approval gate, exact roles/project, no automatic paid workflow, no privileged credentials in exported instructions, idempotent completed setup and uncertain-request rejection.

Only after the user authorizes the concrete scope above:

```text
node test-results/judge-setup.mjs apply --apply-approved-judge-setup
node test-results/judge-setup.mjs verify
node test-results/judge-setup.mjs export-private
```

`apply` requires the explicit flag and stops on a changed plan or destination. `verify` checks existing access without creating business records. `export-private` is local-only and refuses to create judge instructions until sign-in/role/isolation checks have passed. It writes only the two dedicated judge email/password pairs and user-facing instructions to `test-results/judge-setup-private-instructions.txt`; the console receives only the file path and status.

Do not paste the private file into public documentation, chat, source, video or a public Devpost description. Deliver it only through the competition's private testing-credentials field after confirming the field's visibility. `test-results/` is Git-ignored, not encrypted storage; preserve appropriate local filesystem access. Never commit the prepared credential or private instruction files.

An interrupted mutation leaves a `pending` operation in local state. The script deliberately refuses automatic retry. The operator must inspect the exact Auth account/organization/member/project record before repairing that state. Do not regenerate identities, remove the marker blindly or rerun the old integration provisioning script. A failed setup is not grounds to change existing account passwords.

## Judge walkthrough after successful setup

1. Open Review in a separate browser profile, sign in as the dedicated technician and select the judge organization. Open the prepared synthetic change.
2. Run **Investigate → Generate patch → Run isolated tests → Run independent review**. If the saved job is waiting, use **Check / continue job**. Snapshot capture and inference can occupy separate requests. Do not start duplicate stages to poll progress.
3. Use the reviewer account in a different browser profile, or sign out first. Read the case, exact diff and proof; approve only the tested candidate if the model review and tests passed. The technician who created this change cannot self-approve.
4. Publish a draft from a permitted account. The destination is public synthetic source; inspect the actual draft, then leave repository merging to its maintainer.
5. Use a new synthetic passport/change for another experiment. Adding new evidence to an existing laptop invalidates prior proof/approval; preserve completed demonstration evidence.

The account addresses are intentionally synthetic and not inboxes. Password recovery email is therefore unavailable for them; the operator must assist if necessary. This setup does not establish customer SMTP delivery. New Google users still see their own memberships, not automatic access to the judge organization.

## Limits and judging-period readiness

The current application enforces twenty jobs per organization per rolling twenty-four hours, one hundred service-wide, two active jobs per organization and four service-wide. A full five-stage flow normally uses five jobs; continuing the same waiting job does not create another reservation. A Nano investigation plus Super patch and review has a combined conservative reservation of approximately ten cents at the configured rates, not a provider invoice. Actual model failures, usage and separate attempts must be considered.

Default schema ceilings are $1 monthly per organization and $1 aggregate for the service. Global spend does not automatically reset monthly. Setup does not increase either ceiling. Check actual available provider credits and the current service budget before promising availability throughout judging. A successful preparation or configured badge does not establish that future judge requests will run. Maintain enough operator-funded capacity for the competition's verified judging window; any limit increase or paid purchase requires its own authorization.

Before claiming **full judge testing is ready**, record successful delivery of the private credentials, two fresh browser sign-ins, role/isolation checks and one deliberately bounded real workflow through a draft. Read-only setup verification alone proves access, not end-to-end inference/execution. The initial prepared change is intentionally unexecuted. If the public baseline is fixed or its branch changes, use a reviewed reproducible synthetic fixture rather than fabricating a failing result.

## Free public paths available without judge credentials

- [Workshop](https://sparecycle-topaz.vercel.app/app): a real deterministic planner with donor-unavailability toggles, budget/time changes, replay scenarios and local exports. **Run agent review** and **Read note with Nemotron** call real Nebius inference without asking the judge for an API key or payment.
- [Review preview](https://sparecycle-topaz.vercel.app/review): browsable, explicitly labeled sample records while signed out; no executed model/test/approval result is implied by those fixtures.
- [Recorded demonstration](https://sparecycle-topaz.vercel.app/demo) and [public real draft PR](https://github.com/Golden007-prog/sparecycle/pull/1): evidence to inspect separately from a new execution.

Workshop AI has instance-local limits of five accepted requests per IP per ten minutes, sixty total per hour and two concurrent requests, with one active request per IP. A planning action can issue up to three model tool-selection requests plus one final explanation. Those counters reset or multiply across instances and are not a hard account spending ceiling. Deterministic planning continues when AI is unavailable.

Use these public paths immediately, but do not describe the signed-out Review preview as a substitute for the full authenticated judge workflow. See [backend evidence](BACKEND-EVIDENCE.md) for measured results and boundaries, and the current [release record](RELEASE.md) for live authentication/deployment evidence.
