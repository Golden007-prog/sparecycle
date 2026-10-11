# SpareCycle Review demo video

The product tour is a narrated and captioned **1920 × 1080 MP4**, lasting **2 minutes 58.6 seconds**, produced from actual browser captures and user-supplied Nebius screenshots on 11 October 2026. Its focus is the evidence-to-tested-draft-PR workflow, the NVIDIA Nemotron model routing, provider usage and the execution harness. It includes a separate private-repository pilot result.

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

## Render validation

The complete MP4 decodes successfully. The render has sixteen scenes; exact caption count and timings are recorded in `render-evidence.json`. All editorial text is measured against its frame bounds, and the poster and contact sheet were visually inspected. Audio was checked for non-silence and loudness, rather than represented as having been listened to by the agent.

## Web watch page

`public/demo/index.html` provides the responsive, accessible watch page. It includes native video controls, selectable English captions, chapter navigation, a full text transcript, video/caption downloads, source evidence links and a route back to Review. Playback never starts automatically.

The web copy `public/demo/sparecycle-review-demo.mp4` uses the same composition and narration without burned-in captions so viewers can turn its VTT captions on or off. The local MP4 retains burned-in captions for an independent upload. Run `node demo/publish-local.mjs` after a render to refresh the web assets, chapter times and transcript.

The watch page and assets are included in the site's Vercel deployment at `/demo`. Uploading the video to YouTube and adding it to a Devpost submission are separate actions and have not been performed by the demo-generation scripts.
