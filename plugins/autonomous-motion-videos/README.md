# autonomous-motion-videos: narrated explainer videos from code

This is an agent skill (Claude, Codex, Gemini CLI, Antigravity, Cursor) that makes **narrated explainer videos of any length**. They're rendered from code (React + SVG in Remotion, optional Three.js 3D, optional AI images made through your browser) and voiced by free **Microsoft neural voices**. Captions and animations land on the exact spoken word. There are no credits, no watermark and no 8-second clip limit.

This package is **complete on its own**. It includes the voice engine, so you don't need the separate audio skill.

## What's inside

| Path | What it is |
|---|---|
| `SKILL.md` | Instructions the agent follows: intake questions, autonomous route selection, full pipeline, 3D, AI images, QA, premium finish |
| `template/` | Ready-to-render project: edit `script.json`, run 3 commands, get an MP4 |
| `scripts/narrate.py` | Script → per-scene voice + word timings + SRT |
| `scripts/voiceover.py` | Standalone voice-overs with voice, speed and pitch, plus `[pause]`, `[excited]`, `[calm]`… tags |
| `examples/solar-explainer/` | Full source of a 96 s reference video (8 custom scenes + a 3D test scene) |
| [`samples/`](../../samples) | Template render (water cycle, 49 s), contact sheets, voice demo |

## Install

**Claude Code (plugin):**
```
/plugin marketplace add Gupta2495/Agent-motion-studio
/plugin install autonomous-motion-videos@agent-motion-studio
```
**Any agent (Codex, Gemini CLI, Cursor, Antigravity, Claude Code...):**
```
npx skills add Gupta2495/Agent-motion-studio --skill autonomous-motion-videos
```
**Claude.ai / Claude desktop:** upload [`dist/autonomous-motion-videos.zip`](../../dist/autonomous-motion-videos.zip) in Settings → Capabilities → Skills.

Requirements: Python 3 + `pip install edge-tts`, ffmpeg, Node 18+.


## Use

Ask your agent:

- *"Create a 60-second explainer on how vaccines work, American voice, 16:9."*
- *"Make a Hindi explainer on UPI payments for Reels (9:16), female voice, slightly fast."*
- *"Explain photosynthesis with 3D where it helps."*

The skill asks about topic, length, format, voice, speed, pitch and visual route: pure code, 3D, AI images, or AI video clips.

Running unattended, it picks the route from what the agent can do (browser control, image API, 3D support). It never spends paid credits or signs in to anything on its own.

## Or run the template yourself

```bash
cp -r template my-video && cd my-video
./setup.sh                          # npm install + fonts + edge-tts
# edit script.json (topic, scenes, voice, rate, pitch)
npm run narrate && npm run render   # -> out/video.mp4
```

Scene types:
- `title`
- `point`: bullets appear as they're spoken, with an animated icon (sun, cloud, rain, bolt, gear, drop, leaf, spark)
- `outro`: recap cards and a call to action

Any scene can set `image` (a background image), `voice`, `rate` or `pitch`.

## Reference numbers

- **Solar explainer:** 96 s at 1080p30, built in ~15 min, rendered in ~6 min on 2 CPUs.
- **Template render:** 49 s, 8.8 MB.
