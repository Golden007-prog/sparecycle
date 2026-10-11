# SpareCycle Review — submission pack

Prepared 11 October 2026 against the [published release](RELEASE.md) and [backend evidence](BACKEND-EVIDENCE.md). Both YouTube videos have been published publicly; the confirmed links are below. The Devpost entry remains a draft pending eligibility confirmation and verified judge access. This document does not attest to eligibility or establish that submission is complete.

## Devpost fields

**Project name:** SpareCycle Review

**Tagline:** Turn laptop diagnostic evidence into tested, independently approved draft PRs with Nebius and NVIDIA Nemotron.

**Track:** Best Apps and Agents

**Working application:** https://sparecycle-topaz.vercel.app/review

**Project website:** https://sparecycle-topaz.vercel.app

**Public source:** https://github.com/Golden007-prog/sparecycle

**Primary demonstration:** https://www.youtube.com/watch?v=i21ilQRw4go — published publicly; YouTube displays **2:59**. This is the preserved **2m58.6s competition cut**. Use this link as the primary Devpost video.

**Optional supporting walkthrough:** https://www.youtube.com/watch?v=pdLFzA9sT6A — published publicly; YouTube displays **5:39**. The local file is **338.136 seconds**. This is supplementary; the supporting watch page is https://sparecycle-topaz.vercel.app/demo.

**Built with:** Nebius Token Factory, NVIDIA Nemotron, TypeScript, React, Vite, Node.js, Vercel, Supabase, PostgreSQL, GitHub Apps, GitHub Actions, Docker, LangSmith, Zod.

### Confirmed entrant responses and draft status

The entrant confirmed **Individual**, **India**, and **solo participation**. The project-learning response is **Moderate**; the career-value response is **Yes**. No Builders & Brews in-person event was attended; that optional field is left blank. These answers do not establish age, ownership, eligibility or acceptance of the rules.

The saved project name is **SpareCycle Review**. Devpost draft ID is `1226942`; its existing project slug remains `sparecycle`. The last reported form progress was **3 of 5 sections**. This is a progress observation, not a submitted status.

## Devpost project story

### Inspiration

A valid laptop reading can become a false alarm when diagnostic software interprets it incorrectly. The person at the repair bench has the observation; the engineer needs a reproducible defect; the reviewer needs evidence that a proposed change actually addresses it.

SpareCycle Review connects that handoff. Its first customer hypothesis is a refurbishment or IT asset recovery team that maintains its own diagnostic software. The aim is an inspectable path from a laptop's evidence to an accountable software change, while keeping physical repair decisions with qualified technicians.

### What it does

A team creates an organization, registers a laptop passport and records sourced evidence. It connects a selected GitHub repository and one supported diagnostic parser with its existing tests.

Nebius-hosted NVIDIA Nemotron investigates the case. Hardware findings stop for technician review; missing evidence stops for clarification. A supported software finding can proceed through patch generation, isolated testing and a fresh model review. A different organization member must approve the exact tested candidate before the GitHub App creates a **draft pull request**.

The demonstrated defect is concrete: a parser treats a valid zero-percent battery reading as missing data. The original code passes three tests and fails one; the candidate passes all four unchanged tests. The real [public draft PR](https://github.com/Golden007-prog/sparecycle/pull/1) changes only the parser. A separate private-repository pilot completed the same chain using encrypted dispatch to a pinned verifier in that private repository.

The records and reviewer accounts are synthetic. The inference calls, tests and draft PRs are real. The workflow does not merge code or certify that a physical laptop was repaired.

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
- A release with 200 automated tests and a passing production build, plus desktop and narrow-screen checks. These are scoped validation results, not enterprise certification.

### What was learned

Useful agent autonomy depends on knowing when to stop. New evidence must invalidate stale approval. Passing tests only establish covered behavior. A fresh model review helps inspection but can share the writer's mistakes; unchanged tests and human accountability still matter.

The product's value must ultimately be measured in accepted fixes and better technician handoffs, not model counts or generated lines of code.

### What's next

Run supervised design-partner pilots alongside reliability work. Measure accepted fixes, regressions, technician effort and total cost, including failed attempts. Complete customer email delivery, membership lifecycle and guided private setup; then add durable job recovery, enforced company identity and evaluated execution profiles.

The separate SpareCycle Workshop plans repairs from declared parts, time and budget. Its inventory is browser-local today; shared inventory and links to actual bench QA are future work. Google login works, but managed company SSO is not enforced. Private setup still requires an operator-approved verifier and key. No customer revenue, field savings or physical recovery improvement is claimed. The [investment roadmap](https://github.com/Golden007-prog/sparecycle/blob/main/docs/INVESTMENT-ROADMAP.md) defines measurable gates for the next phase.

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

**Authenticated judging access — complete in Devpost's private testing field after verification:** provide dedicated, verified test access to the existing synthetic organization, a supported selected repository and the separate approver role. Explain how judges can run the live supported workflow and obtain help if quota or provider availability blocks it. Ensure the allotted access and credits permit free judging throughout the required period. Do not paste credentials into this public file or reuse personal credentials. A read-only synthetic workspace alone does not establish unrestricted access to the authenticated execution workflow.

## YouTube: primary competition cut

**Title:** SpareCycle Review | Evidence to Tested Draft PR | Nebius x NVIDIA Hackathon

**Published public URL:** https://www.youtube.com/watch?v=i21ilQRw4go

**Upload file:** `test-results/video/sparecycle-review-demo.mp4`

**Duration:** 2m58.6s locally; YouTube displays 2:59. This is the preserved competition cut and primary Devpost video.

**Description:**

SpareCycle Review takes a supported laptop diagnostic defect from recorded evidence to a tested, separately approved draft pull request.

Built for the Best Apps and Agents track of the Nebius x NVIDIA Global AI Hackathon. NVIDIA Nemotron runs through Nebius Token Factory. The server checks scope, time, spend and evidence; GitHub Actions executes the same tests before and after; a different organization member approves the exact candidate before the GitHub App creates a draft.

This edited tour uses genuine application captures and synthetic laptop records. The demonstrated provider calls, tests and draft PR are real. Original result: 3 tests passed, 1 failed. Candidate: all 4 unchanged tests passed. No automatic merge or physical-repair claim is made.

Current scope is a restricted JavaScript diagnostic parser. Private repository use requires an operator-approved verifier and key. Google login works; customer SMTP and enforced company SSO remain unfinished.

Live app: https://sparecycle-topaz.vercel.app/review
Source and setup: https://github.com/Golden007-prog/sparecycle
Actual draft PR: https://github.com/Golden007-prog/sparecycle/pull/1
Backend evidence: https://github.com/Golden007-prog/sparecycle/blob/main/docs/BACKEND-EVIDENCE.md
Supporting deep dive: https://www.youtube.com/watch?v=pdLFzA9sT6A

English captions included. Edited still captures, explanatory diagrams and locally synthesized narration; this is not an uninterrupted screen recording.

## YouTube: supporting deep dive

**Title:** SpareCycle Review Deep Dive | Nebius Nemotron, Private PRs & the Investment Roadmap

**Published public URL:** https://www.youtube.com/watch?v=pdLFzA9sT6A

**Upload file:** `test-results/video/deep-dive/sparecycle-backend-deep-dive.mp4`

**Duration:** 338.136 seconds locally; YouTube displays 5:39. Supplementary walkthrough, not the primary competition video.

**Description:**

How does a laptop observation become a controlled software change—and what still needs work before broader company adoption?

This supporting walkthrough explains SpareCycle Review's best initial customer hypothesis: refurbishment or IT asset recovery teams that own diagnostic software. Follow laptop evidence, the recorded backend execution, Nemotron stage routing, unchanged tests, separate approval and a real draft pull request.

Nebius Token Factory hosts inference; NVIDIA Nemotron supplies the models. Nano investigated the recorded private pilot; Super generated and reviewed the candidate in fresh context. GitHub Actions performed the isolated tests. Relevant private code is sent to Nebius for inference; private verification does not mean local-only reasoning.

The private synthetic fixture changed from one baseline failure to four passing unchanged tests before a different synthetic reviewer approved the draft. The tour explains exact version binding, restricted execution, organization access and metadata-only LangSmith traces. It then separates today's product from proposed investment: dependable onboarding, supervised pilots, job recovery, reconciled usage, shared Workshop data and company identity enforcement.

The records are synthetic; the recorded calls, tests and draft publication are real. This edited explanation does not run new jobs during playback. There is no claim of real customer savings, physical repair, arbitrary-language support or enterprise certification.

Live app: https://sparecycle-topaz.vercel.app/review
Source and setup: https://github.com/Golden007-prog/sparecycle
Backend evidence: https://github.com/Golden007-prog/sparecycle/blob/main/docs/BACKEND-EVIDENCE.md
Investment roadmap: https://github.com/Golden007-prog/sparecycle/blob/main/docs/INVESTMENT-ROADMAP.md
Under-three-minute competition cut: https://www.youtube.com/watch?v=i21ilQRw4go

English captions included. Genuine application captures, explanatory diagrams and locally synthesized narration. This is the supplementary 5m38s tour for the Best Apps and Agents project, not the primary contest video.

## Submission operator notes — not project-story copy

- Official rules checked on 11 October 2026 require a public YouTube demonstration under three minutes, a working project, public licensed source with setup instructions, track selection and platform feedback. They also require free testing access through judging. [Official rules](https://nebiusglobalaihackathon.devpost.com/rules).
- The upload filenames above identify the captioned local copies. Both returned public YouTube URLs are recorded above. No new upload or media regeneration is required merely to update project links.
- Keep the preserved short video as primary. The longer video's extra context is supplementary and judges are not required to watch it.
- Verify entrant/team identity, eligibility, ownership, third-party permissions and any pre-hackathon history directly with the entrant or trusted account information. This document makes none of those attestations. If the project existed before the submission period, describe the actual significant updates in the relevant field.
- The release record identifies the latest conflict-code/lock-order migration as locally tested but not applied to cloud while connector access was unavailable. Do not state that all production readiness work is complete. Current customer SMTP and enforced company SSO are also pending.
- Complete and verify dedicated judge access before claiming it exists in private testing instructions. Confirm public source/license availability and that the deployed workflow matches the final description.
- After successful external actions, update the returned video links and submission URL/status in the repository's release/submission records. Publication of a source file or application is not submission to the competition.
