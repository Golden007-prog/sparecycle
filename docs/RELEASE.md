# SpareCycle release record

Updated 11 October 2026. The workshop remains a browser-local pilot; SpareCycle Review is a separate authenticated, tenant-isolated service with tested public and private diagnostic workflows. Neither is an audited enterprise platform, and the 520-story roadmap is not a claim that all features are implemented.

## Balanced expansion — published 11 October 2026

Implemented the Research desk, Pilot operations desk and developer-review insights described in [BALANCED-RELEASE.md](BALANCED-RELEASE.md). The [200-capability plan](EXPANSION-PLAN.md) is future scope, not 200 newly completed features.

- **249 automated tests passed**, with no failures; TypeScript and the production build passed. Regression checks cover exact-model source rejection, bounded provider errors, stale QA, full-history backup recovery and redacted review exports.
- The local application made a real Tavily Search request followed by Nebius `nvidia/Nemotron-3_5-Lightning` synthesis. Request `2efd1898-a7cb-4866-add3-f85136c8dfcb` returned five model-matched official sources and reported one Tavily credit; the overall observed latency was 6,354 ms. A separate browser request also rendered matching sources and a copyable brief. These observations are not a performance benchmark.
- Pilot browser QA covered assignments, due dates, work records, blocking/rework, three evidence checks, reload persistence, stale-plan detection, archive controls and explicit foreign-workspace recovery with QA reset. Physical completion is still a user declaration.
- Review queue search/filtering, detail checks and redacted export previews were exercised with synthetic records. The export can be copied if browser file saving is unavailable; a save request is not claimed as a completed download.
- The replacement [competition video and deep dive](VIDEO-RELEASE-20261011.md) passed full decode, caption bounds, audio checks and visual inspection. The competition cut is 153.700 seconds; the deep dive is 341.873 seconds. Both include actual research/Pilot/Review captures and distinguish recorded evidence from planned expansion.
- A designed 14-page PDF dossier covers the product, model harness, runtime evidence, setup, business hypothesis and investment gaps. Its published bytes match the visually checked local artifact.

Runtime commit `61014aa1dff69e5405f747f2fbc86a76997d60b6` passed [GitHub verification](https://github.com/Golden007-prog/sparecycle/actions/runs/38114447888). Vercel deployment `dpl_4eWG18Cf6MoYDnVfJRfNefcbkNr6` is READY at the [immutable deployment](https://sparecycle-683mmeyu7-basuoikantik-7538s-projects.vercel.app), aliased to the public application.

The production research request returned HTTP 200 at `2026-10-11T05:21:27.309Z`: Tavily request `cbbb55f0-2a43-439d-b944-b5c33aa33781`, five accepted sources, one reported search credit, followed by Nebius `nvidia/Nemotron-3_5-Lightning` synthesis. The reported workflow latency was 2,324 ms and trace correlation was `908a6207-766d-4286-a992-53d7a6719a4f`. The answer identified the T480 manual and stated that the full document scope was not verified. This confirms a functional runtime Tavily API call in the deployed solution, not only a development connector search.

Replacement videos are public: [competition cut](https://www.youtube.com/watch?v=ErTLptg5Lr4) and [supporting deep dive](https://www.youtube.com/watch?v=oAcolH9AdcQ). Public watch playback advanced with no media error; browser durations were 153.721 and 341.901 seconds. Burned captions are in the uploaded files; the app also serves selectable VTT captions. YouTube reported deep-dive HD processing still pending during publication; public playback was available. After the replacement links were saved and the entrant confirmed permanent deletion, the two old uploads (`i21ilQRw4go`, `pdLFzA9sT6A`) were removed. Their local video copies and hash manifest are preserved.

Final delivery commit `1c9f839f625fbeda31b61c77ffd9b4b68cfccc9f` passed [GitHub verification](https://github.com/Golden007-prog/sparecycle/actions/runs/38114892577). Vercel deployment `dpl_DVMym4jkDPpCSVqhToVvPCYFDPWk` is READY at the [immutable release](https://sparecycle-31emvv6nt-basuoikantik-7538s-projects.vercel.app), aliased to [sparecycle-topaz.vercel.app](https://sparecycle-topaz.vercel.app). Subsequent documentation records the publication outcomes; it does not change the application runtime.

The final read-only delivery check passed all six public routes, exact local hashes and expected content types for both MP4s, both VTTs and the PDF, and HTTP 206 range delivery for both videos. The PDF is 730,789 bytes, SHA-256 `2652cfb941c8f0cfd900b668921d9c8c760787f269622ca908a36b2d043ba44f`. The live watch page exposes both new YouTube links; its Tavily chapter sought to 41.66 seconds with captions showing, full duration loaded and no media error.

Two dedicated synthetic judge accounts independently passed sign-in, technician/reviewer role checks and rejection of access to the original organization. A separate judge organization contains one approved supported public project and a synthetic passport/evidence/change. The setup made no model calls, runner jobs or PRs. Its verified private instructions and the final PDF were saved as `sparecycle-private-judge-kit.zip` in Devpost's private Additional info attachment. No judge or privileged credentials are in public documentation. See [judge access scope](JUDGE-ACCESS.md).

Devpost has the replacement primary video, updated story, Tavily runtime declaration and eligibility responses saved. The entrant explicitly chose **Keep the submission as a draft** on 11 October 2026. The entry remains **4/5 steps done**; final Rules/Terms acceptance and submission were not performed.

The earlier sections below are historical snapshots, including superseded media links.

## Backend and business video release — 11 October 2026

Both videos are now published publicly on YouTube: [the primary competition demonstration](https://www.youtube.com/watch?v=i21ilQRw4go), displayed as **2:59**, and [the supporting backend deep dive](https://www.youtube.com/watch?v=pdLFzA9sT6A), displayed as **5:39**. The local deep-dive file is 338.136 seconds; the YouTube duration label is rounded. No video regeneration was needed to add these links. The watch-page generators support `--pages-only` for link/HTML updates without copying media. Devpost is still a draft pending eligibility confirmation and verified judge access; publishing the videos does not submit the project.

The expanded narrated walkthrough is **5 minutes 38 seconds**, with 23 chapters and 46 caption cues. It explains the recorded private backend run, Nebius hosting and NVIDIA model roles, server-controlled verification and approval, the first customer hypothesis, current gaps and proposed investment gates. The underlying execution uses synthetic fixtures and previously completed real calls; this video release makes no fresh AI or draft-PR calls.

- `/demo` and `/demo/deep-dive.html` present the longer walkthrough. `/demo/competition.html` preserves the original 178.56-second competition cut. Its MP4 SHA-256 remains `00deb79d080ede8e0fe67e4b5369a443a76145f8ff9f4f85e0ba93607cf9cb96`.
- Both the captioned local video and selectable-caption web video passed full decode. The extended narration measured approximately −16.41 LUFS and −1.48 dBTP. Text bounds and the encoded scene contact sheet were inspected.
- The production build passed. Browser checks confirmed playback advancement, no media error, the captions toggle, 23-section transcript, short-cut navigation and the corrected chapter seek at 115.30 seconds. A narrow-screen layout check found no horizontal overflow. No claim of a comprehensive accessibility audit is made.
- [Backend evidence](BACKEND-EVIDENCE.md), [investment roadmap](INVESTMENT-ROADMAP.md) and [research notes](INVESTMENT-RESEARCH-NOTES.md) distinguish implemented controls, recorded synthetic results and future work. Customer demand, savings, repair yield and investment returns remain unvalidated.
- Custom SMTP remains deferred; no company identity provider, cloud migration, new infrastructure purchase or Devpost submission is part of this media release.

Published runtime: `73132a1d654892188b52742feaf6fe58f84a6753`. [GitHub verification passed](https://github.com/Golden007-prog/sparecycle/actions/runs/38110837105), including automated tests, production build, roadmap/pilot-kit checks and source exclusions. Vercel deployment `dpl_8Qfu2Rc2d6MS6BYUNj867Rej8XdH` is READY at the [immutable deployment](https://sparecycle-fooa6169y-basuoikantik-7538s-projects.vercel.app), aliased to the [live demo](https://sparecycle-topaz.vercel.app/demo).

All twelve checked public routes/assets returned the expected media type and matched the local SHA-256 digest; the extended MP4 also returned a valid HTTP 206 byte range for seeking. The live browser loaded its full 338.14-second duration with no media error, all 23 chapters and captions enabled. The backend-evidence chapter sought to 56.87 seconds while paused. The preserved shorter cut is available at [competition.html](https://sparecycle-topaz.vercel.app/demo/competition.html). These delivery checks do not rerun the recorded AI workflow.

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

## Current rollout boundaries

- Authenticated Review has organization accounts, tenant separation and durable workflow records. Workshop and Pilot Operations remain browser-local; shared inventory, concurrent stock reservations and durable Workshop quotas are planned.
- Browser storage is not a server backup. Simultaneous editing across tabs is not coordinated.
- Broad load/security/accessibility audits and customer acceptance testing remain future work. Reported synthetic outcomes are not customer gains.
- The earlier browser file-picker restriction was resolved for publishing the replacement videos and private judging kit. Local app export previews and copying were verified; a browser save request alone is not claimed as a completed file download.
- Both replacement YouTube videos are public. Devpost is intentionally retained as a draft at the entrant's request. Deployment and source publication are not submission.
- Custom SMTP remains deferred. Managed company SSO, broader execution profiles, the pending cloud migration and customer acceptance gates are documented separately; this release does not claim complete enterprise readiness.
- Keep the demo available to judges for the required period after entering.

## Deployment integration

Vercel production deployment is manual. Automatic GitHub-to-Vercel deployment is not connected because the account requires a GitHub Login Connection. GitHub verification runs on pushes; it does not deploy the site. No paid account upgrade or credit purchase was made.
