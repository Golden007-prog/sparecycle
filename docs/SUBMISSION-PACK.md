# SpareCycle Review — submission pack

Prepared 11 October 2026 against the [published release](RELEASE.md) and [backend evidence](BACKEND-EVIDENCE.md). Both replacement YouTube videos are public and playback-verified. The updated story, primary video, Tavily tag and private judge kit are saved in Devpost. The entrant confirmed eligibility and explicitly chose **KEEP DRAFT**: the project has not been submitted, and no final submission is authorized.

## Devpost fields

**Project name:** SpareCycle Review

**Tagline:** Turn laptop diagnostic evidence into tested, independently approved draft PRs with Nebius and NVIDIA Nemotron.

**Track:** Best Apps and Agents

**Working application:** https://sparecycle-topaz.vercel.app/review

**Project website:** https://sparecycle-topaz.vercel.app

**Public source:** https://github.com/Golden007-prog/sparecycle

**Primary demonstration:** https://www.youtube.com/watch?v=ErTLptg5Lr4 — replacement published publicly and playback verified; **2m33.7s** (Studio rounds to **2:34**). Use this link as the primary Devpost video.

**Optional supporting walkthrough:** https://www.youtube.com/watch?v=oAcolH9AdcQ — replacement published publicly and playback verified; **5m41.9s** (Studio rounds to **5:42**). This is supplementary; the supporting watch page is https://sparecycle-topaz.vercel.app/demo.

**Built with:** Nebius Token Factory, NVIDIA Nemotron, Tavily, TypeScript, React, Vite, Node.js, Vercel, Supabase, PostgreSQL, GitHub Apps, GitHub Actions, Docker, LangSmith, Zod.

### Confirmed entrant responses and draft status

The entrant confirmed **Individual**, **India**, and **solo participation**. The project-learning response is **Moderate**; the career-value response is **Yes**. No Builders & Brews in-person event was attended; that optional field is left blank. Eligibility was separately confirmed by the entrant during final preparation; this records the entrant's confirmation rather than an independent eligibility audit.

The saved project name is **SpareCycle Review**. Devpost draft ID is `1226942`; its existing project slug remains `sparecycle`. The verified saved progress is **4 of 5 sections**. The updated project story, replacement video, Tavily tag and private testing instructions are saved. The user's final choice is **KEEP DRAFT**, so this progress must not be described as a completed submission.

## Devpost project story

### Inspiration

A valid laptop reading can become a false alarm when diagnostic software interprets it incorrectly. The person at the repair bench has the observation; the engineer needs a reproducible defect; the reviewer needs evidence that a proposed change actually addresses it.

SpareCycle Review connects that handoff. Its first customer hypothesis is a refurbishment or IT asset recovery team that maintains its own diagnostic software. The aim is an inspectable path from a laptop's evidence to an accountable software change, while keeping physical repair decisions with qualified technicians.

### What it does

A team creates an organization, registers a laptop passport and records sourced evidence. It connects a selected GitHub repository and one supported diagnostic parser with its existing tests.

Nebius-hosted NVIDIA Nemotron investigates the case. Hardware findings stop for technician review; missing evidence stops for clarification. A supported software finding can proceed through patch generation, isolated testing and a fresh model review. A different organization member must approve the exact tested candidate before the GitHub App creates a **draft pull request**.

The demonstrated defect is concrete: a parser treats a valid zero-percent battery reading as missing data. The original code passes three tests and fails one; the candidate passes all four unchanged tests. The real [public draft PR](https://github.com/Golden007-prog/sparecycle/pull/1) changes only the parser. A separate private-repository pilot completed the same chain using encrypted dispatch to a pinned verifier in that private repository.

The records and reviewer accounts are synthetic. The inference calls, tests and draft PRs are real. The workflow does not merge code or certify that a physical laptop was repaired.

The Research desk makes a runtime Tavily Search call for public manufacturer references, filters sources for the exact model, then uses Nebius-hosted Nemotron Lightning to produce a cited brief with uncertainty. A real production request returned five matching T480 sources, including the official hardware maintenance manual. Research does not send passport evidence or private code to Tavily. The Pilot desk tracks browser-local assignments, actual effort, blocks and manual release checks. Developer review adds queue filters, evidence/test-reference checks and redacted handoffs.

### How it was built

React and TypeScript provide the organization, passport and review interface. Vercel hosts the application. Supabase Auth and PostgreSQL row-level security scope evidence, jobs and approvals to organization members.

**Every AI call runs through Nebius Token Factory.** Lightning investigated the public demonstration; Nano investigated the private pilot. Super generated the patches and reviewed them in fresh context. Ultra completed a separate investigation check; that check is not evidence of better patch quality.

The harness requires structured output, bounds time and spend, and rejects changes outside a restricted pure JavaScript diagnostic profile. Code, evidence, tests and approval are bound to exact versions. GitHub Actions runs original and candidate code in isolated, network-disabled containers against unchanged tests. Trusted server code controls publication; the model has no publishing tool. LangSmith records operational metadata with model input/output capture disabled.

### Challenges

A plausible patch is not a verified fix. Early integration work exposed malformed generated source, hash differences caused by JSON key ordering, and review that needed the original evidence to assess the reported defect. Executable-code checks, canonical hashing and evidence-grounded review addressed those problems.

Private execution also needed explicit organization/repository binding, pinned verifier identity and a dedicated transport key. Interrupted external calls are treated as uncertain rather than silently repeated.

### Accomplishments

- A complete, deployed evidence-to-draft workflow with real Nebius inference and inspectable public test/PR evidence.
- A real private synthetic pilot with unchanged tests, separate-account approval and one parser file changed.
- Rejected outsider access and self-approval in the recorded integration checks.
- A release with 249 automated tests and a passing production build, plus desktop and narrow-screen checks. These are scoped validation results, not enterprise certification.
- A real deployed Tavily-to-Nebius research request, with model-matched sources and explicit limits; a designed 14-page project dossier and updated narrated demonstrations.

### What was learned

Useful agent autonomy depends on knowing when to stop. New evidence must invalidate stale approval. Passing tests only establish covered behavior. A fresh model review helps inspection but can share the writer's mistakes; unchanged tests and human accountability still matter.

The product's value must ultimately be measured in accepted fixes and better technician handoffs, not model counts or generated lines of code.

### What's next

Run supervised design-partner pilots alongside reliability work. Measure accepted fixes, regressions, technician effort and total cost, including failed attempts. Complete customer email delivery, membership lifecycle and guided private setup; then add durable job recovery, enforced company identity and evaluated execution profiles.

The separate SpareCycle Workshop plans repairs from declared parts, time and budget. Its inventory and new Pilot work/QA declarations are browser-local today; shared inventory, trustworthy physical observations and cross-team synchronization are future work. The 200-capability balanced expansion plan is planned delivery scope, not 200 shipped features. Google login works, but managed company SSO is not enforced. Private setup still requires an operator-approved verifier and key. No customer revenue, field savings or physical recovery improvement is claimed. The [investment roadmap](https://github.com/Golden007-prog/sparecycle/blob/main/docs/INVESTMENT-ROADMAP.md) defines measurable gates for the next phase.

## Platform feedback field

Nebius Token Factory's compatible inference interface let one bounded application harness call NVIDIA Nemotron Nano, Lightning, Super and Ultra. Structured output and usage metadata made it practical to validate stage results and reserve spend. The application still needed strict executable-code checks and review grounded in the original evidence; a schema-valid answer is not proof of a correct patch.

The live tests used GitHub Actions because Nebius Sandboxes access was not activated. Clearer entitlement discovery and examples covering bounded inference, uncertain outcomes and background continuation would help this workflow. Comparative model evaluation and billing reconciliation remain application work. No Nebius AI Cloud deployment, Serverless Jobs, live Nebius Sandboxes, fine-tuning or local NVIDIA hardware is claimed.

## Additional Devpost technical questions

Use the matching answer for each actual form label. The entrant delegated selection of the three ratings below; they are **draft technical assessments**, not measured model benchmarks or claims of enterprise readiness. Personal answers are limited to the responses explicitly confirmed above.

### Which NVIDIA models were used, and why?

SpareCycle Review uses NVIDIA Nemotron through Nebius Token Factory: Nano and Lightning for evidence investigation, Super for patch generation and a fresh-context review, and an explicitly enabled Ultra option. Lightning investigated the public demonstration; Nano investigated the private pilot; Super proposed and reviewed both candidates. Ultra completed a separate synthetic investigation check. This routing keeps each model's responsibility explicit and lets the harness apply stage-specific limits. All four configured tiers completed actual calls, but no controlled benchmark established a best model or a superior ensemble.

Configured model identifiers:

- `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`
- `nvidia/Nemotron-3_5-Lightning`
- `nvidia/nemotron-3-super-120b-a12b`
- `nvidia/Nemotron-3-Ultra-550b-a55b`

### Model quality rating, 1–10

**Draft delegated assessment: 8/10.** The recorded workflow produced a candidate that passed the four unchanged tests and a separate model review. Early malformed output was rejected during development. The score is a qualitative assessment of the bounded development experience, not a measured accuracy rate or a general model benchmark.

### What prompting approach was used?

Each stage has a separate system instruction and strict JSON schema. Evidence, repository content and test output are treated as untrusted observations. Investigation must choose software, hardware or insufficient evidence and identify next steps. The writer receives the bounded source and existing tests, must preserve exports, and cannot edit tests, add dependencies or use system/network operations. A fresh reviewer receives the original case, before/after source and matching test proof; it must judge the reported defect rather than accept a patch solely because tests pass. The server independently validates output and permissions. A separate human approval is required for publication.

### How did the models compare with alternatives?

No controlled comparison with other model families was performed. Nano and Ultra each completed a separate investigation probe, and Lightning and Super were exercised in the recorded workflow. Individual timing and usage observations are not comparative benchmarks. The next evaluation should use the same held-out diagnostic cases to measure supported-case coverage, accepted fixes, regressions, abstention quality, latency and total cost, including rejected attempts.

### Which Nebius capabilities were used?

Live NVIDIA inference through the Nebius Token Factory API, its compatible chat-completion interface, schema-constrained responses and reported token usage. The application supplies stage routing, validation, deadlines and budget reservations. The frontend/API run on Vercel, shared records use Supabase, and isolated tests use GitHub Actions. A Nebius Sandboxes adapter exists but was not activated. No Nebius AI Cloud, Serverless Jobs, dedicated endpoint or fine-tuning deployment is claimed.

### Likelihood of recommending Nebius, 1–10

**Draft delegated assessment: 9/10.** Token Factory provided a practical route to the NVIDIA models used in the working prototype. This is a qualitative recommendation for the demonstrated use case, subject to the documented integration and operational limits; it does not imply an independently measured service level.

### Development experience rating, 1–10

**Draft delegated assessment: 8/10.** The compatible inference interface reduced integration differences between configured models. Building dependable execution still required application-side validation, failure handling and separate authorization. This is a qualitative technical assessment selected with the entrant's authorization.

### What improvements would help?

Examples that combine structured generation with executable-code validation, unchanged-test verification and safe continuation would help teams build bounded agents. Clear discovery of model-specific reasoning settings and execution-service entitlements would reduce setup ambiguity. Documentation connecting request identifiers, uncertain outcomes, cancellation and usage reconciliation would help production integration. These are proposed developer-experience improvements, not claims that every capability is absent from Nebius.

### What would you ask the model team to prioritize?

Consistent adherence to executable-code constraints, calibrated abstention when evidence is insufficient, and review that identifies plausible patches which only satisfy narrow fixtures. A diagnostic-code evaluation set covering zero/null boundaries, missing evidence, malformed logs and unchanged-test preservation would be useful. The product would benefit from measured reliability on these bounded tasks more than a larger context window alone.

### Which AI tools were used to build the project?

OpenAI Codex assisted with research, implementation, testing, documentation and preparation of the demonstration. The product's runtime AI calls use NVIDIA Nemotron through Nebius Token Factory. LangSmith provides metadata tracing; it is not the inference provider. The video narration uses local Windows speech synthesis. No model fine-tuning or AI-generated customer results are claimed.

### Personal learning or career impact

**Confirmed learning level: Moderate. Confirmed career-value answer: Yes.** No additional employment, education, career outcome or personal achievement is asserted. The project-level learning section above supplies technical context without inventing a personal history.

## Judge testing instructions

Public inspection requires no account:

1. Open https://sparecycle-topaz.vercel.app/review and explore the clearly labeled synthetic workspace. This exploration does not run new model calls or pretend to execute tests.
2. Inspect the [real public verification run](https://github.com/Golden007-prog/sparecycle/actions/runs/38027193047) and [App-authored draft PR](https://github.com/Golden007-prog/sparecycle/pull/1). Compare the failing baseline with the passing candidate and confirm that the tests are unchanged.
3. Read the [backend evidence](https://github.com/Golden007-prog/sparecycle/blob/main/docs/BACKEND-EVIDENCE.md) for the separate private pilot, execution boundaries and recorded checks.
4. Try the separate [Workshop planner](https://sparecycle-topaz.vercel.app/app) with its labeled synthetic batch; change a planning limit or donor availability and inspect the recalculated proposal. Its data is local to the browser.

**Authenticated judging access — verified and delivered privately:** two dedicated synthetic judge accounts have verified sign-ins, distinct roles and checked organization isolation. The private judge kit is saved in Devpost's private testing instructions and was delivered to the entrant. It explains the supported workflow and separate reviewer role. Credentials belong only in that private kit, never this public document or source control. This verification does not promise unlimited provider quota or arbitrary repository access; the documented bounded execution profile and provider availability still apply.

## YouTube: primary competition cut

**Title:** SpareCycle Review | Nebius Nemotron + Tavily | Evidence to Tested Draft PR

**Published public URL:** https://www.youtube.com/watch?v=ErTLptg5Lr4

**Upload file:** `test-results/video/sparecycle-review-demo.mp4`

**Duration:** 153.700104 seconds locally (2m33.7s); Studio displays 2:34. This replacement competition cut has 16 chapters and 16 English caption cues and is the primary Devpost video.

**Description:**

SpareCycle joins public-source research, local refurbishment operations and a supported diagnostic defect's path to a tested, separately approved draft pull request.

Built for the Best Apps and Agents track of the Nebius x NVIDIA Global AI Hackathon. NVIDIA Nemotron runs through Nebius Token Factory. The server checks scope, time, spend and evidence; GitHub Actions executes the same tests before and after; a different organization member approves the exact candidate before the GitHub App creates a draft.

This edited tour uses genuine application captures and synthetic laptop records. The demonstrated provider calls, tests and draft PR are real. Original result: 3 tests passed, 1 failed. Candidate: all 4 unchanged tests passed. No automatic merge or physical-repair claim is made.

Tavily retrieves official references for a public model question; NVIDIA Nemotron on Nebius synthesizes bounded excerpts with checked citations and uncertainty. Pilot Operations freezes a plan and records local work, effort and referenced manual checks. Review insights surface loaded-record issues without rerunning tests or granting approval. The separate 200-capability roadmap is planned work.

Current scope is a restricted JavaScript diagnostic parser. Private repository use requires an operator-approved verifier and key. Google login works; customer SMTP and enforced company SSO remain unfinished.

Live app: https://sparecycle-topaz.vercel.app/review
Source and setup: https://github.com/Golden007-prog/sparecycle
Actual draft PR: https://github.com/Golden007-prog/sparecycle/pull/1
Backend evidence: https://github.com/Golden007-prog/sparecycle/blob/main/docs/BACKEND-EVIDENCE.md
Supporting deep dive: https://www.youtube.com/watch?v=oAcolH9AdcQ
Project dossier: https://sparecycle-topaz.vercel.app/sparecycle-project-dossier.pdf

English captions included. Edited still captures, explanatory diagrams and locally synthesized narration; this is not an uninterrupted screen recording.

## YouTube: supporting deep dive

**Title:** SpareCycle Deep Dive | Nebius, NVIDIA Nemotron, Tavily & the AI Harness

**Published public URL:** https://www.youtube.com/watch?v=oAcolH9AdcQ

**Upload file:** `test-results/video/deep-dive/sparecycle-backend-deep-dive.mp4`

**Duration:** 341.872938 seconds locally (5m41.9s); Studio displays 5:42. This replacement has 26 chapters and 38 English caption cues. It is supplementary, not the primary competition video.

**Description:**

How does a laptop observation become a controlled software change—and what still needs work before broader company adoption?

This supporting walkthrough explains SpareCycle Review's best initial customer hypothesis: refurbishment or IT asset recovery teams that own diagnostic software. Follow laptop evidence, the recorded backend execution, Nemotron stage routing, unchanged tests, separate approval and a real draft pull request.

It also shows runtime Tavily research with Nebius synthesis, frozen local Pilot Operations records and the developer attention queue. Reference links do not authorize hardware work; manual pilot checks do not certify physical outcomes; queue insights compare loaded records without running tests. The investment section separates these implemented workflows from the 200 planned capabilities and unvalidated business hypotheses.

Nebius Token Factory hosts inference; NVIDIA Nemotron supplies the models. Nano investigated the recorded private pilot; Super generated and reviewed the candidate in fresh context. GitHub Actions performed the isolated tests. Relevant private code is sent to Nebius for inference; private verification does not mean local-only reasoning.

The private synthetic fixture changed from one baseline failure to four passing unchanged tests before a different synthetic reviewer approved the draft. The tour explains exact version binding, restricted execution, organization access and metadata-only LangSmith traces. It then separates today's product from proposed investment: dependable onboarding, supervised pilots, job recovery, reconciled usage, shared Workshop data and company identity enforcement.

The records are synthetic; the recorded calls, tests and draft publication are real. This edited explanation does not run new jobs during playback. There is no claim of real customer savings, physical repair, arbitrary-language support or enterprise certification.

Live app: https://sparecycle-topaz.vercel.app/review
Source and setup: https://github.com/Golden007-prog/sparecycle
Backend evidence: https://github.com/Golden007-prog/sparecycle/blob/main/docs/BACKEND-EVIDENCE.md
Investment roadmap: https://github.com/Golden007-prog/sparecycle/blob/main/docs/INVESTMENT-ROADMAP.md
Under-three-minute competition cut: https://www.youtube.com/watch?v=ErTLptg5Lr4
Project dossier: https://sparecycle-topaz.vercel.app/sparecycle-project-dossier.pdf

English captions included. Genuine application captures, explanatory diagrams and locally synthesized narration. This is the supplementary 5m41.9s tour for the Best Apps and Agents project, not the primary contest video.

## Submission operator notes — not project-story copy

- Official rules checked on 11 October 2026 require a public YouTube demonstration under three minutes, a working project, public licensed source with setup instructions, track selection and platform feedback. They also require free testing access through judging. [Official rules](https://nebiusglobalaihackathon.devpost.com/rules).
- The upload filenames above identify the captioned local copies. Both returned public YouTube URLs are recorded above. No new upload or media regeneration is required merely to update project links.
- Keep the verified replacement short video as primary. The longer video's extra context is supplementary and judges are not required to watch it. The previous uploads were deleted on 11 October 2026 after approval and replacement verification; their local backups remain preserved.
- The entrant confirmed eligibility. Retain the actual entrant-provided information and any relevant project history; do not turn a saved draft into an independent eligibility or ownership audit.
- The release record identifies the latest conflict-code/lock-order migration as locally tested but not applied to cloud while connector access was unavailable. Do not state that all production readiness work is complete. Current customer SMTP and enforced company SSO are also pending.
- Dedicated judge accounts, roles, sign-ins and isolation were verified, and the private kit was delivered. Final live route, media and PDF checks passed; production video chapter seeking and captions were verified.
- **Do not submit.** The user explicitly chose **KEEP DRAFT** after preparation. Devpost remains at 4 of 5 saved sections. Publishing the application, videos or this document does not submit the project, and a later final submission requires a new explicit user instruction.
