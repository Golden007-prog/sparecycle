# SpareCycle Review demonstration

This directory contains the reproducible storyboard and composition scripts for a narrated, captioned product tour. Screenshots in `assets/` are genuine browser captures of the live application and its actual draft pull request; the demonstration records are synthetic.

The final MP4, subtitles and render checks are written to `test-results/video/`, which is ignored by Git. A finished local video is not a public YouTube upload or a Devpost submission.

The video uses local Windows speech synthesis and FFmpeg. It makes no external model requests. All claim text must be checked against the final release before rendering. It does not claim physical hardware repair, arbitrary private-repository execution, SAML readiness or delivered email until those have separate evidence.

1. Run `. './demo/render-slides.ps1'` in Windows PowerShell to draw the editorial frames from genuine screen captures.
2. Run `. './demo/render-voice.ps1'` in the same Windows PowerShell environment to render local narration.
3. `node demo/render-video.mjs` composes the MP4, captions, poster and contact sheet.
4. `node demo/validate-video.mjs` verifies decoding and measures the audio.
5. `node demo/publish-local.mjs` copies the web video and captions into `public/demo/` and updates the watch page's chapter navigation and transcript. The web video uses selectable captions; the local upload copy has captions burned in.

Captures were made through the connected browser tools, not a recreated interface. Image cropping in the video is editorial framing only; the UI itself is unchanged.
