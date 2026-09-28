---
description: Make a narrated explainer video from a topic or script (voice, captions, animation; any length)
argument-hint: "[topic or path/to/script]"
---

Create an explainer video with the **autonomous-motion-videos** skill.

Topic or script from the user (may be empty): $ARGUMENTS

Follow the skill: run the intake (topic and key points, length, format 16:9 / 9:16 / 4:5 / 1:1, voice profile, speed, pitch, visual route: pure code / 3D / AI images / AI video clips, style). If the session is unattended, choose defaults and the route from available capabilities as the skill describes.

Prefer the fast path: copy the skill's `template/`, write `script.json`, run `./setup.sh`, `npm run narrate`, preview stills, fix layout, `npm run render`. Deliver `out/video.mp4` and `out/narration.srt` and report duration, voice and route used.
