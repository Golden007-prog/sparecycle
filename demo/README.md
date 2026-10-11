# SpareCycle Review demonstration

This directory contains two reproducible, narrated product tours. The original competition cut is 2m58.6s; the backend and business deep dive is 5m38.1s. Screenshots in `assets/` are genuine browser captures of the live application and its actual draft pull request; the demonstration records are synthetic. Labeled diagrams explain architecture and the future roadmap.

The final MP4, subtitles and render checks are written to `test-results/video/`, which is ignored by Git. A finished local video is not a public YouTube upload or a Devpost submission.

The video uses local Windows speech synthesis and FFmpeg. It makes no external model requests. All claim text must be checked against the final release before rendering. It does not claim physical hardware repair, arbitrary private-repository execution, SAML readiness or delivered email until those have separate evidence.

1. Run `. './demo/render-slides.ps1'` in Windows PowerShell to draw the editorial frames from genuine screen captures.
2. Run `. './demo/render-voice.ps1'` in the same Windows PowerShell environment to render local narration.
3. `node demo/render-video.mjs` composes the MP4, captions, poster and contact sheet.
4. `node demo/validate-video.mjs` verifies decoding and measures the audio.
5. `node demo/publish-local.mjs` refreshes the competition web video, captions and page. The web video uses selectable captions; the local upload copy has captions burned in.

For the deeper tour, use `storyboard-deep-dive.json`, `. './demo/render-slides.ps1' -DeepDive`, `. './demo/render-voice.ps1' -DeepDive`, `node demo/render-video.mjs --deep-dive`, `node demo/validate-video.mjs --deep-dive`, then `node demo/publish-deep-dive.mjs`. Its intermediate files stay under `test-results/video/deep-dive/`; its web assets have distinct names. The publisher refuses to proceed if the preserved competition MP4 hash changes.

`/demo` and `/demo/deep-dive.html` show the longer tour; `/demo/competition.html` shows the original short cut. Both offer captions, chapter navigation, download links and a full transcript. The original competition cut is the one suitable for the contest's three-minute limit. YouTube upload and Devpost submission are separate actions.

Deep-dive narration is grounded in `docs/BACKEND-EVIDENCE.md` and `docs/INVESTMENT-ROADMAP.md`. It distinguishes Nebius inference from GitHub Actions verification, a saved run from a new execution, model checks from comparative quality, and future investment work from current functionality. No new provider calls are made to render the video.

Captures were made through the connected browser tools, not a recreated interface. Image cropping and gentle focus motion are editorial framing only; the UI itself is unchanged. Sequential diagram highlights guide attention; they are not a fabricated live execution indicator. Local speech synthesis supplies the narration.
