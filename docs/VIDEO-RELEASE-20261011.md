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

These are machine audio checks and visual frame inspection. They do not claim a separate human listening pass, production playback check or YouTube processing verification. Those release checks remain with the final deployment/upload workflow.

## What the added scenes establish

**Research:** the genuine local application capture shows a real Tavily response summarized by NVIDIA Nemotron Lightning on Nebius. The accompanying verified request `2efd1898-a7cb-4866-add3-f85136c8dfcb` returned five model-matched sources, consumed one reported Tavily credit and completed in 6,354 ms. Its label explicitly says local runtime. Production provider evidence is recorded separately in the release ledger. Citation validation does not prove a generated sentence is true or authorize a physical repair.

**Pilot:** the synthetic local run shows a frozen proposal, recorded progress and scorecard. Assignment, due dates, actual work, blockers, referenced checks and exported handoffs remain browser-local declarations. They do not reserve real stock, certify erasure or establish independent hardware outcomes.

**Review:** the synthetic queue demonstrates loaded-record insights. It compares evidence and proof references, filters visible records and supports redacted handoffs. It does not rerun tests, refresh repository head or grant authorization. The public/private PR proof shown elsewhere is separately recorded real execution.

## Publication and retention

Local watch pages: `/demo/competition.html`, `/demo/deep-dive.html` and `/demo/`. Replacement YouTube links are pending; `demo/youtube-release.json` is the source of truth. After both replacement uploads are verified, put their exact watch URLs in that file and run `node demo/publish-deep-dive.mjs --pages-only`. This refreshes all three watch pages without rewriting media.

The previous local videos, storyboards, watch pages and evidence were preserved in `test-results/video/previous-release/`; its manifest records their hashes. This media work did not upload, delete or change a YouTube video. Do not delete the previous uploads until the replacement processing, captions, accessibility and final links are verified.

Reproducible sources: `demo/storyboard.json`, `demo/storyboard-deep-dive.json`, the genuine files in `demo/assets`, narration/frame/video render scripts and `demo/validate-video.mjs`. Local render evidence is stored beside each upload file.
