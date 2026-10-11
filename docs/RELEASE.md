# SpareCycle release record

Updated 11 October 2026. The workshop remains a browser-local pilot; SpareCycle Review is a separate authenticated, tenant-isolated service with tested public and private diagnostic workflows. Neither is an audited enterprise platform, and the 520-story roadmap is not a claim that all features are implemented.

## Backend and business video release — 11 October 2026

The expanded narrated walkthrough is **5 minutes 38 seconds**, with 23 chapters and 46 caption cues. It explains the recorded private backend run, Nebius hosting and NVIDIA model roles, server-controlled verification and approval, the first customer hypothesis, current gaps and proposed investment gates. The underlying execution uses synthetic fixtures and previously completed real calls; this video release makes no fresh model or publication calls.

- `/demo` and `/demo/deep-dive.html` present the longer walkthrough. `/demo/competition.html` preserves the original 178.56-second competition cut. Its MP4 SHA-256 remains `00deb79d080ede8e0fe67e4b5369a443a76145f8ff9f4f85e0ba93607cf9cb96`.
- Both the captioned local video and selectable-caption web video passed full decode. The extended narration measured approximately −16.41 LUFS and −1.48 dBTP. Text bounds and the encoded scene contact sheet were inspected.
- The production build passed. Browser checks confirmed playback advancement, no media error, the captions toggle, 23-section transcript, short-cut navigation and the corrected chapter seek at 115.30 seconds. A narrow-screen layout check found no horizontal overflow. No claim of a comprehensive accessibility audit is made.
- [Backend evidence](BACKEND-EVIDENCE.md), [investment roadmap](INVESTMENT-ROADMAP.md) and [research notes](INVESTMENT-RESEARCH-NOTES.md) distinguish implemented controls, recorded synthetic results and future work. Customer demand, savings, repair yield and investment returns remain unvalidated.
- Custom SMTP remains deferred; no company identity provider, cloud migration, new infrastructure purchase or Devpost submission is part of this media release.

Publication verification is recorded below once the release is live.

## Private review and authentication release — 11 October 2026

The synthetic private pilot completed real Nebius Nano investigation, Super patching and review, encrypted verification in the same private GitHub repository, a separate test-account approval, and draft PR publication. The unchanged four-test suite had one failing baseline test and four passing candidate tests. Self-approval and access from an unrelated account were rejected. The supported target remains a bounded JavaScript diagnostic parser, with operator-provisioned private runners; this is not arbitrary project execution or unattended repair.

- Local validation: 200 automated tests and the production build passed. Auth screens were checked at desktop and 390px widths.
- Google is enabled in the selected Supabase project. The app exposes Google login only when its server configuration enables it. Login does not grant organization membership.
- Optional custom OIDC login is implemented and disabled pending a company identity provider. It is not enforced enterprise SSO or domain-based access.
- Customer SMTP delivery and branded email-template installation were deferred by the user. Prepared templates are in `supabase/templates`; default Supabase delivery restrictions still apply.
- The conflict-code/lock-order migration `20261010060900_review_conflict_codes_and_lock_order.sql` passed local database tests but remains unapplied to cloud while the Supabase connector is unavailable. No cloud migration is claimed by this release.
- The narrated demo and watch page include real application captures, provider usage evidence, the bounded harness, captions and a transcript. Usage screenshot totals are rounded provider observations, not cost benchmarks.

The sections below preserve earlier release evidence and limitations as recorded at those releases.

### Published verification

- Runtime commit: `2714ffd0476c116e57100fe4a910800381aecae7`; [successful GitHub verification](https://github.com/Golden007-prog/sparecycle/actions/runs/38109161627).
- Vercel production deployment: `dpl_CkvJwNruJVRoQN9jZm5m6EwprX4d`, READY; [immutable deployment](https://sparecycle-20qvcdx5g-basuoikantik-7538s-projects.vercel.app).
- [Live demo](https://sparecycle-topaz.vercel.app/demo): 2 minutes 58.6 seconds, 1080p, selectable captions, transcript and chapters. All five published assets matched their tested local SHA-256 digests; video was served as `video/mp4` and captions as `text/vtt`.
- Production smoke passed nine bounded read-only requests: public configuration, unauthenticated rejection, foreign-origin rejection, strict action validation, owner evidence retrieval and outsider isolation. The deployed service returned the completed private workflow with its exact base, patch and proof hashes.
- The separate private run inspected by the integration audit had a metadata-only artifact, no exact source/candidate/known secret strings in the inspected logs or proof, and a private draft with one parser change and unchanged test content. This was a targeted audit, not a claim of a comprehensive security assessment.
- Delivery folder `E:\LOCAL helper\sparecycle` was fast-forwarded; its existing batch file and private settings were preserved. Its production build passed.
- Google sign-in completed on the live site through the selected business account, returned to the clean `/review` URL, and persisted after reload. The new account saw its own empty organization state and did not gain access to the synthetic test organization. This verifies ordinary Google authentication, not enforced company SSO.
- The final live watch page loaded the full 178.56-second video without a media error. Selecting the harness chapter sought to 68.77 seconds while remaining paused, with captions enabled.

## Website and company pilot release

Runtime commit `e17998f` adds the landing page, workflow guide, company pilot guide, data page and reproducible public pilot kit. The workshop is available at [Open workshop](https://sparecycle-topaz.vercel.app/app), with direct links for [company setup](https://sparecycle-topaz.vercel.app/app?setup=1) and the [catalog](https://sparecycle-topaz.vercel.app/app?view=catalog).

- Production deployment: `dpl_B7zFE1qQzpwCfRqUa5v1U88HB35P`; [immutable deployment](https://sparecycle-5gb7g8xhv-basuoikantik-7538s-projects.vercel.app).
- [GitHub verification passed](https://github.com/Golden007-prog/sparecycle/actions/runs/38022439465): 56 tests, build, roadmap check, pilot-kit check and source exclusions.
- Local browser checks verified desktop/mobile layouts, interactive donor failure, navigation focus, setup and catalog links. Production checks verified all four public pages, setup open/refresh behavior and catalog navigation.
- The public ZIP returned HTTP 200 and its SHA-256 matched the local tested kit. The public roadmap returned HTTP 200; health retained Nebius/NVIDIA and tracing configuration.
- The delivery folder was fast-forwarded to this runtime and its production build passed. The source/build scan checked 94 files with no credential or excluded-path findings.
- The AI backend was unchanged by this website release. The real 4.1-second Nebius result below remains the latest recorded live model call; a health flag is not counted as a new model call.

Live website capture: [sparecycle-landing-live.jpg](assets/sparecycle-landing-live.jpg).

## Prior verified company runtime

| Evidence | Observation |
| --- | --- |
| Public source | [Golden007-prog/sparecycle](https://github.com/Golden007-prog/sparecycle) |
| Company runtime commit | `0a28d2b` |
| Live site | [sparecycle-topaz.vercel.app](https://sparecycle-topaz.vercel.app) |
| Company deployment | `dpl_9nirUUvw9qafyiXsCnXdoQaJFH7P` |
| Automated verification | 56 tests passed; TypeScript and production build passed locally, in the delivery folder and on Vercel |
| GitHub verification | [Successful run](https://github.com/Golden007-prog/sparecycle/actions/runs/38020705745) on the runtime commit |
| Credential exclusion | Source/build scan found no private credential values or forbidden tracked paths |
| Company browser flow | Three-step setup, named batch copies, independent limits, reload persistence, CSV import, cross-company review clearing and non-overwriting backup restoration verified locally |
| Public browser smoke | Updated UI and setup dialog opened; CSV template import returned one proposal and one held device |
| Live AI provider | NVIDIA `nvidia/Nemotron-3_5-Lightning` through **Nebius Token Factory** |
| New company-release model result | 4.1 seconds; inventory and planning tools completed; seven proposals vs five baseline, $25, 150 minutes |
| Observability | LangSmith metadata tracing; prior delivered root/tool records inspected with empty inputs and outputs. The latest returned correlation ID alone is not a new trace-content inspection. |
| Kaggle reference | 291 retained historical listing variants; source hash, quality exclusions and reproduction check recorded |
| Capability roadmap | 520 stories; 216 differentiation candidates; 29 shipped-story flags and 491 planned flags; generated public catalog matches source |
| Requested local delivery | `E:\LOCAL helper\sparecycle`; existing user batch template and private settings preserved |

See [VALIDATION.md](VALIDATION.md) for the evidence, narrow-screen measurements and exact boundaries of the browser checks.

## Pilot use

Start with the [company quickstart](COMPANY-QUICKSTART.md): create a company workspace, import reviewed device/part CSV files, then inspect the proposal and export draft work orders. Use one coordinator, one active editing tab, and a small non-sensitive batch. Keep workspace exports as backups. Restoring a backup creates separate company copies rather than overwriting existing valid records.

A declared hold is incompatible with eligibility. The allocator excludes unverified parts and never infers exact part approval from the Kaggle catalog. Technician inspection, repairs, sanitization evidence and final QA remain separate physical responsibilities.

## Remaining production and submission work

- Authenticated company accounts, server-enforced tenant separation, concurrent stock reservations, durable audit records and shared quotas are planned.
- Browser storage is not a server backup. Simultaneous editing across tabs is not coordinated.
- Broad load/security/accessibility audits and customer acceptance testing remain future work. Reported synthetic outcomes are not customer gains.
- Browser file-picker automation was blocked by the extension's file-URL permission. Pasted CSV and backup flows were verified; file-picker behavior is not claimed as an observed test.
- The public YouTube demo and Devpost submission remain unfinished. Deployment and source publication are not submission.
- Keep the demo available to judges for the required period after entering.

## Deployment integration

Vercel production deployment is manual. Automatic GitHub-to-Vercel deployment is not connected because the account requires a GitHub Login Connection. GitHub verification runs on pushes; it does not deploy the site. No paid account upgrade or credit purchase was made.
