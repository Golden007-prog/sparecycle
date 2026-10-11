# SpareCycle video release — 11 October 2026

This replacement release adds genuine application captures of Tavily research, Pilot Operations and developer Review insights. It preserves the recorded Nebius/NVIDIA usage, bounded harness, unchanged-test verification, separate approval and actual draft-PR proof. The 200-capability map is planned work, never a shipped-feature claim.

## Deliverables

| Cut | Upload file (burned English captions) | Runtime | Chapters / cues | Bytes |
| --- | --- | ---: | ---: | ---: |
| Competition | `test-results/video/sparecycle-review-demo.mp4` | 153.700104 s | 16 / 16 | 6,537,198 |
| Backend and business | `test-results/video/deep-dive/sparecycle-backend-deep-dive.mp4` | 341.872938 s | 26 / 38 | 18,550,462 |

The competition cut is below the 180-second limit. Both files are 1920 × 1080 H.264 with AAC narration, encoded locally. Narration uses the installed Microsoft Zira voice; this is an edited demonstration rather than an uninterrupted screen recording.

The website serves separate video assemblies with selectable English VTT captions:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/demo/sparecycle-review-demo.mp4` | 4,999,941 | `3c596098b8af992990f08aad8ea3d39c08a3bf47f096f14eb44afb74d78084e8` |
| `public/demo/sparecycle-backend-deep-dive.mp4` | 14,419,177 | `bcb617b250c150649ebd7dc571b7d93391d81de45ac143fca4254932cbe04126` |

Upload-file SHA-256 digests:

- Competition: `66611866a2800818a64d37ad9d999588deb7e75cfba170f88f221b3d4e118513`.
- Deep dive: `07e076338a43f779527332e0f542bcb545c1047ee202c7442fc8ec72b2331f18`.

## Verification performed

- Full FFmpeg decoding succeeded for both captioned uploads and both web assemblies.
- All storyboard text passed measured frame bounds during rendering.
- Encoded contact sheets covering every scene were visually inspected. The new Research, Pilot and Review captures were also inspected at large size after cropping.
- All 16 competition and 38 deep-dive captions are ordered, have positive durations and stay within the media bounds.
- Competition loudness: −16.38 LUFS; true peak −1.42 dBTP. Deep dive: −16.37 LUFS; true peak −1.46 dBTP. No clipping or detected silence longer than 1.8 seconds.
- Watch-page chapters and transcripts are generated from the current storyboard and recorded scene timings. Local publication checks the intentional competition digest before and after publishing the deep dive.
- Final production checks passed for the live routes, both media files, captions and the project PDF. Chapter seeking and selectable captions were exercised on the deployed watch pages.
- Both replacement YouTube videos are public and playback was verified. Their browser media durations were 153.721 and 341.901 seconds; the source-file durations above are retained as the reproducible local measurements.

The audio measurements are machine checks, not a separate human listening pass. Public YouTube playback and production player behavior were verified; that does not assert that every YouTube resolution had finished processing at publication.

## What the added scenes establish

**Research:** the genuine local application capture shows a real Tavily response summarized by NVIDIA Nemotron Lightning on Nebius. The accompanying verified request `2efd1898-a7cb-4866-add3-f85136c8dfcb` returned five model-matched sources, consumed one reported Tavily credit and completed in 6,354 ms. Its label explicitly says local runtime. Production provider evidence is recorded separately in the release ledger. Citation validation does not prove a generated sentence is true or authorize a physical repair.

**Pilot:** the synthetic local run shows a frozen proposal, recorded progress and scorecard. Assignment, due dates, actual work, blockers, referenced checks and exported handoffs remain browser-local declarations. They do not reserve real stock, certify erasure or establish independent hardware outcomes.

**Review:** the synthetic queue demonstrates loaded-record insights. It compares evidence and proof references, filters visible records and supports redacted handoffs. It does not rerun tests, refresh repository head or grant authorization. The public/private PR proof shown elsewhere is separately recorded real execution.

## Publication and retention

Live watch pages: [competition](https://sparecycle-topaz.vercel.app/demo/competition.html), [deep dive](https://sparecycle-topaz.vercel.app/demo/deep-dive.html) and [demo entry](https://sparecycle-topaz.vercel.app/demo/). The verified replacement links are recorded in `demo/youtube-release.json` and published on these pages:

- **SpareCycle Review | Nebius Nemotron + Tavily | Evidence to Tested Draft PR** — [public competition video](https://www.youtube.com/watch?v=ErTLptg5Lr4), 2m33.7s locally; Studio displays 2:34.
- **SpareCycle Deep Dive | Nebius, NVIDIA Nemotron, Tavily & the AI Harness** — [public supporting video](https://www.youtube.com/watch?v=oAcolH9AdcQ), 5m41.9s locally; Studio displays 5:42.

The previous YouTube uploads `i21ilQRw4go` and `pdLFzA9sT6A` were deleted on 11 October 2026 after replacement verification and the user's approval. Studio showed the old two entries absent and both replacements present. Their local videos, storyboards, watch pages and evidence remain preserved in `test-results/video/previous-release/`; its manifest records their hashes.

Devpost has the updated project story, primary video, Tavily tag and private judge kit saved at 4 of 5 draft sections. Two isolated judge accounts, their roles, sign-ins and organization isolation were verified. The user explicitly chose **KEEP DRAFT**. The project has not been submitted.

Reproducible sources: `demo/storyboard.json`, `demo/storyboard-deep-dive.json`, the genuine files in `demo/assets`, narration/frame/video render scripts and `demo/validate-video.mjs`. Local render evidence is stored beside each upload file.
