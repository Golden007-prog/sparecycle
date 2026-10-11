# SpareCycle Review demo video

Two narrated, captioned **1920 × 1080 MP4** tours use actual browser captures and user-supplied Nebius screenshots from 11 October 2026. The original **2m58.6s competition cut** is preserved. The new **5m38.1s backend and business deep dive** explains recorded backend execution, the AI harness, the best initial customer workflow, current gaps and a proposed investment roadmap.

The watch page defaults to the longer tour at `/demo` and `/demo/deep-dive.html`. A prominent selector links the original cut at `/demo/competition.html`; its MP4 is byte-for-byte unchanged, SHA-256 `00deb79d080ede8e0fe67e4b5369a443a76145f8ff9f4f85e0ba93607cf9cb96`. Only the shorter cut satisfies the contest's maximum three-minute video length. No YouTube upload or Devpost submission has been performed.

Artifacts are generated under `test-results/video/`:

- `sparecycle-review-demo.mp4` — H.264 video with AAC narration and burned-in English captions.
- `sparecycle-review-demo.vtt` — matching WebVTT captions.
- `sparecycle-review-demo-script.md` — timed narration script.
- `poster.png` — opening frame with caption.
- `contact-sheet.jpg` — one sampled frame per scene for visual review.
- `render-evidence.json` — source scene list, render metadata and stream properties.

Reproduction scripts and the editorial storyboard are in `demo/`. The voice is locally synthesized with Microsoft Zira Desktop. No external speech provider or additional model requests are needed to render it. The video is an edited tour using genuine still captures, not a continuous screen recording.

## Evidence represented

- Live signed-in company workspace and laptop passport, using the existing synthetic integration-pilot account.
- The saved original issue and evidence revision.
- A real Nebius Nemotron Lightning investigation, followed by the stored candidate, tests and independent review.
- The real GitHub Actions result: baseline **1 failed / 3 passed**, candidate **4 passed / 0 failed**, with unchanged tests.
- Actual draft PR: [Golden007-prog/sparecycle#1](https://github.com/Golden007-prog/sparecycle/pull/1). The PR was created by the SpareCycle Review GitHub App and remains a draft.
- User-supplied Nebius Token Factory overview and usage views. The overview is cropped to exclude its account strip. The four-model table shows rounded usage/cost buckets; it is not presented as an exact per-change invoice.
- An explanatory diagram of the implemented harness: strict model output, 40-second model-stage limit, reserved spend, exact code/evidence hashes, unchanged tests, stale-evidence rejection, separate approval and metadata-only LangSmith traces.
- A sanitized summary of the separate private-repository run verified on 11 October: Nano investigation, Super patch/review, encrypted dispatch to the same private repository's workflow, original **1 failed / 3 passed**, candidate **4 passed / 0 failed**, a different synthetic QA reviewer, and a real draft PR. No private code or repository link is included in the public video.

The demonstration explicitly labels the fixture and QA accounts as synthetic. It makes no claim of actual physical hardware repair, real customers or arbitrary project execution. Private repository execution was verified for the single synthetic pilot described above. Enterprise email and organization SSO remain dependent on provider configuration and verification; the closing scope scene does not present them as complete.

## Backend and business deep dive

The longer cut contains 23 scenes with 46 narration cues. It adds a labeled summary of actual private-run completion timestamps, distinguishes Nebius-hosted NVIDIA inference from GitHub Actions testing, and shows the implemented triage classification. Only the software branch has the demonstrated live fixture. Relevant private code is sent to Nebius for inference; the video does not imply on-premises reasoning or fixed-region public inference.

The best first customer is presented as a hypothesis: a refurbishment or ITAD team with a diagnostics engineer and an owned project. Private setup still needs an operator-approved verifier and repository key. Google sign-in works, while custom company email is deferred; managed SSO also needs identity-policy enforcement and deprovisioning. Workshop remains browser-local and separate from Review's shared records.

The roadmap explicitly describes future work, including reliable onboarding, durable jobs, cancellation, usage reconciliation, model evaluations, shared operational records and additional execution profiles. Supervised customer pilots start alongside reliability work. Proposed paid pilots, subscription pricing and metrics are hypotheses; savings, physical throughput and environmental outcomes are not measured results. The narrative uses the reviewed [backend evidence](BACKEND-EVIDENCE.md) and [investment roadmap](INVESTMENT-ROADMAP.md).

Long-cut local outputs live in `test-results/video/deep-dive/`, including `sparecycle-backend-deep-dive.mp4`, matching VTT and timed script, poster, sampled contact sheet, and render evidence. The public web MP4 is 13,152,487 bytes before deployment. Gentle focus motion stays within genuine captures; sequential highlights on diagrams are editorial emphasis, not a claimed live stage indicator.

## Render validation

Both complete videos decode successfully. The short render has sixteen scenes; the long render has 23. Exact caption count and timings are recorded in each `render-evidence.json`. Editorial text is measured against its frame bounds, and posters and encoded contact sheets were visually inspected. Long-cut audio measured −16.41 LUFS and −1.48 dBTP with no detected silence over 1.8 seconds. Audio was checked for non-silence and loudness, rather than represented as having been listened to by the agent.

## Web watch page

`public/demo/index.html` and `deep-dive.html` provide the responsive long-cut watch page; `competition.html` provides the short cut. They include native controls, selectable English captions, chapter navigation, a full transcript, video/caption downloads, source evidence links and a route back to Review. Playback never starts automatically. The longer page also links the backend evidence and investment roadmap.

Both public web MP4s omit burned-in captions so viewers can turn the VTT tracks on or off. The separate local upload copies have captions burned in. Run `node demo/publish-local.mjs` for the short cut or `node demo/publish-deep-dive.mjs` for the long cut after rendering. Reproduction instructions are in [demo/README.md](../demo/README.md).

The watch page and assets are included in the site's Vercel deployment at `/demo`. Uploading the video to YouTube and adding it to a Devpost submission are separate actions and have not been performed by the demo-generation scripts.
