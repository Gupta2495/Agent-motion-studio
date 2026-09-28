---
name: autonomous-motion-videos
description: "Make narrated explainer videos of any length from code (Remotion/React/SVG), synced to free Microsoft TTS, with optional 3D scenes and AI images made via a browser."
---

# Autonomous Motion Videos

Build explainer / educational / product videos **entirely from code**: React + SVG (and optionally Three.js 3D) rendered frame-by-frame by **Remotion**, narrated with free **Microsoft neural voices** (edge-tts), with karaoke captions and animations that fire on the exact spoken word. No 8-10 s clip limit, no credits, fully editable, re-timeable, re-voiceable in 10 Indian languages + ~130 others.

Works in any agent with a shell + Node 18+ + Python 3 + ffmpeg (Claude, Codex, Gemini CLI, Antigravity, Cursor...).

**Benchmark (reference build):** 96 s, 1920x1080@30, 8 scenes, English (India) narration - total ~15 min wall-clock: script+TTS ~2 min, scene code ~5 min, preview/fixes ~2 min, render ~6 min on 2 vCPUs (~3.4-8 fps). Output 24.5 MB H.264 + AAC. Cost: 0.

Use this skill when the user wants an explainer, how-it-works video, educational animation, product walkthrough, data story, reel/short with narration, or asks for a video longer or more precise than AI video clips allow.

---

## 0. Fast path - bundled starter template (use this first)

This skill ships a tested, ready-to-render project in `template/` and the narration script in `scripts/narrate.py`.

```bash
cp -r <this-skill-folder>/template my-video && cd my-video
./setup.sh                      # npm install + fonts (from npm) + edge-tts; needs Node 18+, Python 3, ffmpeg
# edit script.json  (see below), then:
npm run narrate                 # voice + word timings -> public/audio, src/timeline.json, out/narration.srt
npm run render                  # -> out/video.mp4   (npm run render:3d when a scene uses Three.js)
npx remotion studio src/index.ts   # optional live preview in a browser
```
Standalone voice-over (no video): `python3 <this-skill-folder>/scripts/voiceover.py -v en-IN-PrabhatNeural -r slightly-fast -p natural -f script.txt -o voiceover.mp3 --srt voiceover.srt` (supports [pause 1s], [excited], [calm], [sad], [nervous], [serious], [soft] tags; run with --help).

If Remotion cannot download its own browser (offline/sandbox), set `REMOTION_BROWSER=/path/to/chrome-headless-shell` before rendering.

`script.json` drives everything:
```json
{
  "voice": "en-IN-PrabhatNeural", "rate": "+10%", "pitch": "+0Hz", "padBefore": 0.5, "padAfter": 0.8,
  "brand": "Energy Explained", "captions": true,
  "scenes": [
    {"id": "intro", "type": "title", "title": "How the Water Cycle Works", "subtitle": "From ocean to cloud to rain", "text": "narration..."},
    {"id": "evaporation", "type": "point", "title": "Evaporation", "icon": "sun",
     "bullets": ["Sun heats oceans and lakes", "Water turns into invisible vapour"], "text": "narration...", "image": "images/evap.png"},
    {"id": "outro", "type": "outro", "title": "And the cycle repeats", "cta": "Follow for more", "text": "narration..."}
  ]
}
```
- Scene types in the template: `title` (animated title + particles), `point` (numbered bullets that appear when their words are spoken, step tracker, big animated icon), `outro` (recap cards that light up as each point is named + CTA).
- Icons: `sun`, `cloud`, `rain`, `bolt`, `gear`, `drop`, `leaf`, `spark` (default). Add more in `src/components/Icons.tsx`.
- `image` (route C): any file under `public/`; the scene switches to a Ken Burns background with a dark overlay.
- Per-scene `voice` / `rate` / `pitch` overrides work (bilingual videos, dialogue).
- Custom scenes (like the solar-cell cutaway or a 3D turbine): write a component, register it in `src/scenes/index.ts`, and set `"type": "<your-key>"` in script.json.
- Reference build: `examples/solar-explainer/` contains the full source of the 96 s solar explainer (8 bespoke scenes) - copy patterns from it.

Everything below documents the same system in depth (for building bespoke scenes, 3D, AI images, or when the bundled files are unavailable).

## 1. Intake - ask the user (interactive mode)

Ask in one message; offer defaults; accept partial answers.

1. **Topic & audience** - what is being explained, to whom (students, customers, general public), and the 4-8 key steps/points.
2. **Length & format** - target length (30 s - 5 min), aspect: 16:9 (YouTube), 9:16 (Reels/Shorts), 1:1.
3. **Voice** - profile (Indian English / Hindi / other Indian language / American / British / other), male/female, **speed** (slow / normal / slightly-fast / fast; default slightly-fast +8-10%), **pitch** (deeper / natural / brighter; default natural). Captions on/off (default on).
4. **Visual route** - pick one or combine:
   - **A. Pure programmatic** - flat/infographic SVG illustration, diagrams, particles, counters. Fastest, crisp text, zero dependencies. *(default)*
   - **B. 3D** - Three.js scenes (turbines, panels, molecules, products) with lighting and camera moves. Richer, slower to render.
   - **C. AI images** - generate scene backgrounds/illustrations with an image tool (e.g. Google Flow via the user's own browser, Arena AI, Meta AI, or an image API), then animate them in code (Ken Burns, parallax) with code-drawn labels/flows on top.
   - **D. AI video B-roll** - drop a few AI video clips (Flow Veo/Omni, Arena) behind code overlays. Uses credits - confirm before spending.
5. **Style** - brand colours/fonts or a mood (clean blueprint, warm sunrise, dark tech, playful). Music bed yes/no.

Then write the script and scene plan, show it briefly, and proceed.

## 2. Autonomous mode - choose the route from available capabilities

When running unattended, do not ask; detect and decide, then state the choice in the final report.

| Check | How | If yes |
|---|---|---|
| Browser automation in the user's signed-in browser (e.g. Claude in Chrome tools, a Playwright/Chrome MCP with a logged-in profile) | tool list contains browser navigate/click/screenshot tools | Route C available (free images: Google Flow image models, Arena AI image Direct mode, Meta AI). Follow any user preference about which tool/site to use and always download the files. |
| Image-generation tool or API (image MCP, OpenAI/Gemini image API key in env) | tool list / env vars | Route C via API (no browser needed) |
| WebGL rendering works headless | run the 3D smoke test in section 8 (`npx remotion still ... --gl=angle`) - non-empty PNG in < 60 s | Route B available |
| Paid AI video credits | only with explicit prior user approval | Route D |
| none of the above | - | Route A |

Default autonomous choice: **A**, upgraded to **A+B** for physical/mechanical subjects if 3D works, and **A+C** if a free image path exists and the topic benefits from realism. Never spend paid credits, create accounts, or sign in to new services autonomously.

## 3. Pipeline overview

```
script (scenes) -> narrate.py -> public/audio/*.mp3 + src/timeline.json (word timings, scene frames)
                                         |
                 scene components read timeline -> <Sequence> per scene + <Audio> + <Captions>
                                         |
               preview stills (60% into each scene) -> fix layout -> full render -> verify
```

Voice first: scene lengths come from the narration, so voice, language or speed changes re-time the whole video automatically.

## 4. Project setup (tested versions)

```bash
mkdir my-explainer && cd my-explainer && mkdir -p src/scenes src/components public/audio public/fonts public/images out
pip install edge-tts   # (--break-system-packages on system Python)
```

`package.json`
```json
{
  "name": "my-explainer", "private": true,
  "scripts": { "render": "remotion render src/index.ts Main out/video.mp4 --codec=h264 --crf=18" },
  "dependencies": { "@remotion/cli": "4.0.290", "remotion": "4.0.290", "react": "18.3.1", "react-dom": "18.3.1" },
  "devDependencies": { "typescript": "5.6.3", "@types/react": "18.3.12" }
}
```

`tsconfig.json`
```json
{ "compilerOptions": { "target": "ES2020", "module": "ESNext", "moduleResolution": "bundler", "jsx": "react-jsx", "strict": false, "esModuleInterop": true, "resolveJsonModule": true, "skipLibCheck": true } }
```

`remotion.config.ts`
```ts
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(null); // null = auto; lower it on small machines
// If Remotion cannot download its own browser (offline/sandbox), point to an installed headless Chromium:
// Config.setBrowserExecutable("/path/to/chrome-headless-shell");
```

```bash
npm install
# Fonts (npm works even where GitHub/Google Fonts are blocked):
npm pack @fontsource/inter @fontsource/space-grotesk
for f in fontsource-*.tgz; do mkdir -p "x-${f%.tgz}" && tar xzf "$f" -C "x-${f%.tgz}"; done
cp x-fontsource-inter-*/package/files/inter-latin-{400,600,800}-normal.woff2 public/fonts/
cp x-fontsource-space-grotesk-*/package/files/space-grotesk-latin-{500,700}-normal.woff2 public/fonts/
```
For Indic scripts, also pack e.g. `@fontsource/noto-sans-devanagari` and add an @font-face.

## 5. Narration -> timeline (narrate.py)

`script.json`
```json
{
  "voice": "en-IN-PrabhatNeural", "rate": "+10%", "pitch": "+0Hz",
  "padBefore": 0.5, "padAfter": 0.8,
  "scenes": [
    {"id": "intro", "text": "How does a solar power plant turn sunlight into electricity? Let's follow the energy."},
    {"id": "cell",  "text": "When photons of sunlight strike the silicon, they knock electrons loose."}
  ]
}
```
Voices (free): Indian English en-IN-PrabhatNeural (M) / en-IN-NeerjaNeural (F); Hindi hi-IN-MadhurNeural / hi-IN-SwaraNeural; also bn, ta, te, mr, gu, kn, ml, ur -IN; American en-US-ChristopherNeural / en-US-AriaNeural; British en-GB-RyanNeural / en-GB-SoniaNeural. List all: `edge-tts --list-voices`. Speed = `rate`; pitch does not change speed. Write acronyms spaced ("D C"), Indic text in native script.

`narrate.py` (write verbatim)
```python
#!/usr/bin/env python3
"""script.json -> public/audio/<id>.mp3 + src/timeline.json (+ --srt, --merged). Usage: python3 narrate.py script.json --out public --fps 30"""
import argparse, asyncio, json, os, ssl, subprocess, sys
import edge_tts
import edge_tts.communicate as _comm


def _patch_ssl():  # trust a TLS-inspecting proxy CA (verification stays on)
    for ca in (os.environ.get("EDGE_TTS_CA_BUNDLE"), os.environ.get("SSL_CERT_FILE"), "/root/.ccr/ca-bundle.crt"):
        if ca and os.path.exists(ca):
            _comm._SSL_CTX = ssl.create_default_context(cafile=ca); return


def _dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())


async def _speak(text, voice, rate, pitch, volume, path):
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=volume, boundary="WordBoundary")
    audio, words = bytearray(), []
    async for ch in comm.stream():
        if ch["type"] == "audio": audio.extend(ch["data"])
        elif ch["type"] == "WordBoundary":
            words.append({"t": round(ch["offset"] / 1e7, 3), "d": round(ch["duration"] / 1e7, 3), "w": ch["text"]})
    if not audio: raise RuntimeError(f"No audio for {path} - check voice name / retry / try another voice")
    open(path, "wb").write(audio)
    return words


def _t(s):
    ms = int(round(s * 1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"


def _lines(words, max_chars=44, pause=0.28):
    lines, cur, n = [], [], 0
    for i, w in enumerate(words):
        gap = w["t"] - (words[i-1]["t"] + words[i-1]["d"]) if i else 0
        if cur and (n + len(w["w"]) > max_chars or gap > pause): lines.append(cur); cur, n = [], 0
        cur.append(w); n += len(w["w"]) + 1
    if cur:
        if lines and len(cur) <= 2 and cur[0]["t"] - (lines[-1][-1]["t"] + lines[-1][-1]["d"]) <= pause: lines[-1].extend(cur)
        else: lines.append(cur)
    return lines


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script"); ap.add_argument("--out", default="public"); ap.add_argument("--timeline", default="src/timeline.json")
    ap.add_argument("--fps", type=int, default=30); ap.add_argument("--srt"); ap.add_argument("--merged")
    a = ap.parse_args(); _patch_ssl()
    cfg = json.load(open(a.script, encoding="utf-8")); os.makedirs(os.path.join(a.out, "audio"), exist_ok=True)
    pb, pa, fps = cfg.get("padBefore", 0.5), cfg.get("padAfter", 0.8), a.fps
    scenes, start = [], 0
    for sc in cfg["scenes"]:
        g = lambda k, d: sc.get(k, cfg.get(k, d))
        voice, rel = g("voice", "en-IN-PrabhatNeural"), f"audio/{sc['id']}.mp3"
        words = await _speak(sc["text"], voice, g("rate", "+0%"), g("pitch", "+0Hz"), g("volume", "+0%"), os.path.join(a.out, rel))
        vsec = _dur(os.path.join(a.out, rel)); frames = round((pb + vsec + pa) * fps)
        scenes.append({"id": sc["id"], "text": sc["text"], "voice": voice, "audio": rel, "voiceSec": round(vsec, 3), "words": words,
                       "startFrame": start, "durationFrames": frames, "voiceOffsetFrames": round(pb * fps)})
        print(f"{sc['id']:14s} voice {vsec:6.2f}s  scene {frames/fps:6.2f}s", file=sys.stderr); start += frames
    os.makedirs(os.path.dirname(a.timeline) or ".", exist_ok=True)
    json.dump({"fps": fps, "totalFrames": start, "scenes": scenes}, open(a.timeline, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"TOTAL {start/fps:.1f}s ({start} frames) -> {a.timeline}", file=sys.stderr)
    if a.srt:
        out, i = [], 1
        for s in scenes:
            base, L = (s["startFrame"] + s["voiceOffsetFrames"]) / fps, _lines(s["words"])
            for k, ln in enumerate(L):
                t0, t1 = base + ln[0]["t"], base + ln[-1]["t"] + ln[-1]["d"] + 0.15
                if k + 1 < len(L): t1 = min(t1, base + L[k+1][0]["t"] - 0.02)
                out.append(f"{i}\n{_t(t0)} --> {_t(t1)}\n{' '.join(w['w'] for w in ln)}\n"); i += 1
        open(a.srt, "w", encoding="utf-8").write("\n".join(out))
    if a.merged:
        ins, flt = [], []
        for i, s in enumerate(scenes):
            ins += ["-i", os.path.join(a.out, s["audio"])]; ms = int(round((s["startFrame"] + s["voiceOffsetFrames"]) / fps * 1000))
            flt.append(f"[{i}]adelay={ms}|{ms}[a{i}]")
        flt.append("".join(f"[a{i}]" for i in range(len(scenes))) + f"amix=inputs={len(scenes)}:normalize=0,apad=whole_dur={start/fps}[o]")
        subprocess.check_call(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(flt), "-map", "[o]", "-t", f"{start/fps}", a.merged])


asyncio.run(main())
```

Run: `python3 narrate.py script.json --out public --fps 30`. Check the per-scene durations it prints.

## 6. Core code (write these files)

`src/theme.ts` - canvas size, palette, fonts
```ts
import { staticFile } from "remotion";
export const W = 1920, H = 1080;
export const C = { ink: "#F4F7FB", inkDim: "rgba(244,247,251,0.62)", navy: "#08111F", accent: "#FFC83D",
  blue: "#56CCF2", amber: "#FFB547", green: "#7CF29A" };
export const FONT_BODY = "Inter, system-ui, sans-serif";
export const FONT_HEAD = "'Space Grotesk', Inter, sans-serif";
export const fontFaceCss = [["Inter",400,"inter-latin-400-normal"],["Inter",600,"inter-latin-600-normal"],["Inter",800,"inter-latin-800-normal"],
  ["Space Grotesk",500,"space-grotesk-latin-500-normal"],["Space Grotesk",700,"space-grotesk-latin-700-normal"]]
  .map(([f,w,file]) => `@font-face{font-family:'${f}';font-weight:${w};src:url(${staticFile(`fonts/${file}.woff2`)}) format('woff2');}`).join("\n");
```

`src/scenes/types.ts`
```ts
export type Word = { t: number; d: number; w: string };
export type SceneData = { id: string; text: string; audio: string; voiceSec: number; words: Word[];
  startFrame: number; durationFrames: number; voiceOffsetFrames: number };
export type SceneProps = { s: SceneData; n: number; total: number };
/** scene-local frame when a word matching `re` is spoken (nth match) - use to trigger animations */
export const wordFrame = (s: SceneData, re: RegExp, fps = 30, nth = 0) => {
  const hits = s.words.filter((w) => re.test(w.w)); const w = hits[Math.min(nth, hits.length - 1)];
  return w ? Math.round(s.voiceOffsetFrames + w.t * fps) : s.voiceOffsetFrames;
};
```

`src/components/common.tsx` - reusable building blocks (tested)
```tsx
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT_BODY, FONT_HEAD, W, H } from "../theme";

export const ease = (f: number, i: [number, number], o: [number, number], e = Easing.bezier(0.33, 0, 0.2, 1)) =>
  interpolate(f, i, o, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",")})`;
};
export type Pt = [number, number];
export const pointAt = (pts: Pt[], t: number): Pt => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = (((t % 1) + 1) % 1) * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) { const k = d / segs[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } d -= segs[i]; }
  return pts[pts.length - 1];
};
export const polyD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");

/** "01 / 06  Title" scene heading */
export const SceneTag: React.FC<{ n: number; total: number; label: string }> = ({ n, total, label }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 80, top: 64, opacity: ease(f, [6, 22], [0, 1]), fontFamily: FONT_HEAD, color: C.ink }}>
      <div style={{ fontSize: 22, letterSpacing: 4, fontWeight: 500, opacity: 0.75 }}>{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
      <div style={{ fontSize: 46, fontWeight: 700, marginTop: 6, textShadow: "0 2px 18px rgba(0,0,0,0.35)" }}>{label}</div>
      <div style={{ height: 4, width: 120 * ease(f, [10, 34], [0, 1]), background: C.accent, borderRadius: 2, marginTop: 12 }} />
    </div>
  );
};

/** progress pills, e.g. steps={["Sunlight","Cells","Inverter"]} */
export const StepTracker: React.FC<{ steps: string[]; active: number }> = ({ steps, active }) => (
  <div style={{ position: "absolute", right: 80, top: 74, display: "flex", gap: 10, fontFamily: FONT_BODY }}>
    {steps.map((s, i) => (
      <div key={s} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 18, fontWeight: 600, border: "1px solid rgba(255,255,255,0.14)",
        background: i === active ? C.accent : i < active ? "rgba(255,255,255,0.18)" : "rgba(6,12,24,0.35)", color: i === active ? "#1A1405" : C.ink }}>{s}</div>
    ))}
  </div>
);

/** karaoke captions; splits on pauses (TTS words have no punctuation) */
type Word = { t: number; d: number; w: string };
export const Captions: React.FC<{ words: Word[]; offsetFrames: number }> = ({ words, offsetFrames }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = (f - offsetFrames) / fps;
  const lines: Word[][] = []; let cur: Word[] = [], len = 0;
  words.forEach((w, i) => { const p = words[i - 1]; const gap = p ? w.t - (p.t + p.d) : 0;
    if (cur.length && (len + w.w.length > 44 || gap > 0.28)) { lines.push(cur); cur = []; len = 0; } cur.push(w); len += w.w.length + 1; });
  if (cur.length) lines.push(cur);
  const idx = lines.findIndex((l, i) => t >= l[0].t - 0.15 && (!lines[i + 1] || t < lines[i + 1][0].t - 0.15));
  if (idx < 0 || t < -0.2) return null;
  const line = lines[idx], end = line[line.length - 1];
  const fade = idx === lines.length - 1 ? ease(t, [end.t + end.d + 0.4, end.t + end.d + 0.7], [1, 0]) : 1;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", opacity: fade }}>
      <div style={{ background: "rgba(6,12,24,0.62)", padding: "14px 30px", borderRadius: 14, fontFamily: FONT_BODY, fontSize: 38, fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)" }}>
        {line.map((w, i) => { const active = t >= w.t && t < w.t + Math.max(w.d, 0.18) + 0.05;
          return <span key={i} style={{ marginRight: 11, color: active ? C.accent : t >= w.t ? C.ink : C.inkDim }}>{w.w}</span>; })}
      </div>
    </div>
  );
};

/** label with leader line; keep tx > x when the anchor is near the left edge so text stays on screen */
export const Callout: React.FC<{ x: number; y: number; tx: number; ty: number; text: string; sub?: string; at: number }> = ({ x, y, tx, ty, text, sub, at }) => {
  const f = useCurrentFrame(); const p = ease(f, [at, at + 18], [0, 1]);
  return (<>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <circle cx={x} cy={y} r={7 * p} fill={C.ink} /><circle cx={x} cy={y} r={16 * p} fill="none" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
      <line x1={x} y1={y} x2={lerp(x, tx, p)} y2={lerp(y, ty, p)} stroke={C.ink} strokeWidth={2.5} />
    </svg>
    <div style={{ position: "absolute", left: tx + (tx > x ? 14 : -14), top: ty - 26, opacity: ease(f, [at + 8, at + 22], [0, 1]), transform: `translateX(${tx > x ? 0 : -100}%)`,
      fontFamily: FONT_HEAD, color: C.ink, background: "rgba(6,12,24,0.6)", padding: "10px 18px", borderRadius: 12 }}>
      <div style={{ fontSize: 34, fontWeight: 700 }}>{text}</div>
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 22, opacity: 0.8 }}>{sub}</div>}
    </div>
  </>);
};

/** glowing particles flowing along a polyline (current, water, data, traffic...) */
export const Flow: React.FC<{ pts: Pt[]; color: string; count?: number; speed?: number; size?: number; on?: number; seed?: string; wiggle?: number }> = ({ pts, color, count = 14, speed = 0.012, size = 7, on = 1, seed = "f", wiggle = 0 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <path d={polyD(pts)} fill="none" stroke={color} strokeOpacity={0.22 * on} strokeWidth={size * 1.6} strokeLinecap="round" strokeLinejoin="round" />
      {Array.from({ length: count }).map((_, i) => { const [x, y] = pointAt(pts, i / count + f * speed + random(seed + i) * 0.02); const wob = wiggle ? Math.sin(f * 0.3 + i) * wiggle : 0;
        return <g key={i} opacity={on}><circle cx={x} cy={y + wob} r={size * 2.2} fill={color} opacity={0.18} /><circle cx={x} cy={y + wob} r={size} fill={color} /></g>; })}
    </svg>
  );
};

/** route C: slow zoom/pan over a still image (Ken Burns); layer two images at different speeds for parallax */
export const KenBurns: React.FC<{ src: string; dur: number; from?: number; to?: number; panX?: number; panY?: number }> = ({ src, dur, from = 1.0, to = 1.12, panX = -30, panY = -10 }) => {
  const f = useCurrentFrame(); const k = ease(f, [0, dur], [0, 1], Easing.linear);
  return <AbsoluteFill style={{ overflow: "hidden" }}><Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover",
    transform: `scale(${lerp(from, to, k)}) translate(${panX * k}px, ${panY * k}px)` }} /></AbsoluteFill>;
};

export const Vignette: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)" }} />;
export const SceneFade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: Math.min(ease(f, [0, 12], [0, 1]), ease(f, [dur - 12, dur], [1, 0])) }}>{children}</AbsoluteFill>;
};
```

`src/Video.tsx`, `src/Root.tsx`, `src/index.ts`
```tsx
// Video.tsx
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import timeline from "./timeline.json";
import { fontFaceCss } from "./theme";
import { Captions, SceneFade } from "./components/common";
import { SceneData } from "./scenes/types";
import { SCENES } from "./scenes"; // export const SCENES: Record<string, React.FC<SceneProps>> = { intro: Intro, ... }

export const Main: React.FC = () => {
  const scenes = timeline.scenes as SceneData[];
  return (
    <AbsoluteFill style={{ background: "#08111F" }}>
      <style>{fontFaceCss}</style>
      {scenes.map((s, i) => { const Scene = SCENES[s.id];
        return (
          <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationFrames} name={s.id}>
            <SceneFade dur={s.durationFrames}><Scene s={s} n={i} total={scenes.length - 2} /></SceneFade>
            <Captions words={s.words} offsetFrames={s.voiceOffsetFrames} />
            <Sequence from={s.voiceOffsetFrames}><Audio src={staticFile(s.audio)} /></Sequence>
          </Sequence>
        ); })}
    </AbsoluteFill>
  );
};

// Root.tsx
import { Composition } from "remotion";
import timeline from "./timeline.json";
import { Main } from "./Video";
export const RemotionRoot = () => (
  <Composition id="Main" component={Main} durationInFrames={timeline.totalFrames} fps={timeline.fps} width={1920} height={1080} />
);

// index.ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```
For 9:16 use width 1080, height 1920 and re-layout (captions higher, one column).

## 7. Scene design patterns (route A)

One scene = one idea = one narration line. Proven patterns from the reference solar explainer:

| Pattern | Build | Use for |
|---|---|---|
| Hero title | gradient sky (dawn->day), sun rising, words sliding up staggered | intro |
| Perspective field | rows of parallelograms receding to a vanishing point, revealed front-to-back, glint sweep | panels, crops, crowds, servers |
| Cutaway cross-section | stacked layers with side face for depth, labels on the right, particles hitting a layer | cells, soil, skin, engines |
| Blueprint schematic | navy grid background, boxes + `Flow` particles along wires | circuits, pipelines, data flows |
| Signal morph | flat line -> scrolling sine, counter ("50 Hz") on the spoken word | DC->AC, before/after |
| Gauge / counter | big number animating (use locale formatting, e.g. en-IN 1,32,000) + bars | quantities, stats |
| Day->night transition | mix sky colours, sunset, windows lighting in random order | outcomes, time passing |
| Recap row | icons lighting up one by one on their spoken word, then a final line | summary/outro |

Sync rule: every key visual beat uses `wordFrame(s, /word/)` so it lands exactly when narrated.
Layout rules: keep text > 22 px at 1080p; captions bottom 70 px - keep the lower 200 px free of labels; give labels a dark pill background over busy imagery; avoid labels near the left edge anchored to the left.

## 8. Route B - 3D (Three.js via @remotion/three)

```bash
npm install @remotion/three@4.0.290 three@0.170.0 @react-three/fiber@8.17.10 @types/three@0.170.0
```
```tsx
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const Turbine3D: React.FC = () => {
  const f = useCurrentFrame(); const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#5AA8F0, #CFE9FF)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [interpolate(f, [0, 150], [-3, 3]), 2, 11], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={2.2} />
        <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#6FA35A" /></mesh>
        <mesh position={[0, -1.2, 0]}><cylinderGeometry args={[0.12, 0.28, 5.6, 24]} /><meshStandardMaterial color="#E6EAF0" roughness={0.4} /></mesh>
        <group position={[0, 1.7, 0.6]} rotation={[0, 0, f * 0.08]}>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, 0, (i * 2 * Math.PI) / 3]}>
              <mesh position={[0, 1.6, 0]}><boxGeometry args={[0.18, 3.2, 0.05]} /><meshStandardMaterial color="#F2F5FA" /></mesh>
            </group>
          ))}
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
```
- **Always render 3D with `--gl=angle`** (headless WebGL): `npx remotion still src/index.ts Turbine3D out/t.png --frame=60 --gl=angle` (smoke test, ~10 s) and `npx remotion render ... --gl=angle`.
- Drive every motion from `useCurrentFrame()` (never `useFrame`/clock time) so renders are deterministic.
- Realism comes from assets + lighting: load `.glb` models from `public/` with `useLoader(GLTFLoader, staticFile("models/x.glb"))` (`three/examples/jsm/loaders/GLTFLoader`), free CC0 models/HDRIs (e.g. Poly Haven), PBR materials, soft shadows. Primitives alone look clean but toy-like.
- Mix freely: a 3D scene can sit under 2D SVG overlays, captions and `Callout`s.

## 9. Route C - AI images via the user's browser (or an image API)

1. Write one image prompt per scene with a **shared style block** for consistency, e.g. `Clean modern 3D render, soft daylight, blue/amber palette, wide 16:9, lots of empty sky at top for titles, no text, no watermark.` Always add "no text" - image models garble labels; draw labels in code.
2. Generate with the best available path:
   - **Browser automation in the user's signed-in browser** (e.g. Claude in Chrome): open the image tool the user prefers, e.g. Google Flow (`flow.google.com`, new project, choose an image model such as Nano Banana, 16:9, x2 variants) or Arena AI (`arena.ai/image`, Direct mode, pick a model such as seedream). Enter the prompt, wait, pick the best variant, **download** it. Respect any saved user preference about which site/method to use; do not create accounts or sign in on the user's behalf; confirm before anything that spends paid credits.
   - **Image API / MCP** if connected: call it directly.
3. Move files into `public/images/<scene-id>.png` (downloads usually land in `~/Downloads`).
4. Animate with `KenBurns` (slow 1.0->1.12 zoom), optionally two layers (foreground cut-out + background) moving at different speeds for parallax, then overlay code elements: `Flow`, `Callout`, counters, captions.
5. Arena and similar sites may ignore aspect ratio - check sizes (`sips -g pixelWidth -g pixelHeight` on macOS / `ffprobe`) and rely on `objectFit: cover`.

## 10. Route D - AI video B-roll (optional, uses credits)

Generate short clips (Flow Veo/Omni, Arena video battles) only with user approval, download, place in `public/clips/`, and use `<OffthreadVideo src={staticFile("clips/x.mp4")} muted />` inside a scene, with code overlays on top. Keep narration from edge-tts so voice stays consistent.

## 11. Preview -> fix -> render -> verify

```bash
npx tsc --noEmit -p .
# stills ~60% into each scene (fast layout check; add --gl=angle if any 3D)
python3 -c "import json;d=json.load(open('src/timeline.json'));print(' '.join(str(s['startFrame']+int(s['durationFrames']*0.62)) for s in d['scenes']))" > frames.txt
for fr in $(cat frames.txt); do npx remotion still src/index.ts Main out/stills/f$fr.png --frame=$fr --log=error; done
# tile them to review in one image
ffmpeg -y -i out/stills/f<A>.png -i out/stills/f<B>.png ... -filter_complex "...hstack/vstack..." out/sheet.png

npx remotion render src/index.ts Main out/video.mp4 --codec=h264 --crf=18   # add --gl=angle for 3D
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate out/video.mp4
ffmpeg -i out/video.mp4 -af volumedetect -f null - 2>&1 | grep mean_volume      # expect about -18 to -22 dB
ffmpeg -y -i out/video.mp4 -vf "fps=12/<duration>,scale=480:-1,tile=4x3" -frames:v 1 out/timeline_sheet.png
```
QA checklist: no text off-screen or overlapping the caption band; labels readable on light backgrounds; captions never merge two sentences; every scene's key beat lands on its word; audio present in every scene; no blank frames at scene boundaries.

Typical fixes found in review: rows/objects overlapping (reduce heights), callout text pushed off the left edge (swap anchor side), counters colliding with the sun/logo (move to empty sky), captions merging sentences (pause-based split).

## 12. Premium finish (optional upgrades)

1. **Sound design** - royalty-free music bed at -22 to -28 dB under the voice (duck it during speech), whooshes on transitions, subtle hums/clicks on key beats. Biggest perceived-quality jump per minute of work.
2. **3D hero shots** (route B) for the 1-2 most physical moments.
3. **AI-image backgrounds** (route C) with code overlays for realism + exact labels.
4. **Cinematic post** - motion blur (`@remotion/motion-blur`), depth-of-field/blur on backgrounds, glow on highlights, light film grain, colour grade; subtle camera drift in every scene.
5. **Transitions** (`@remotion/transitions`), kinetic typography, consistent brand kit, intro/outro sting.
6. **Multi-format** - render 16:9, then a 9:16 layout of the same timeline for Reels/Shorts; 4K via width/height 3840x2160.
7. **Multi-language** - swap `script.json` text + voice (hi-IN, ta-IN...), re-run `narrate.py`, re-render; add a Noto font for the script.

## 13. Troubleshooting

| Symptom | Fix |
|---|---|
| edge-tts `CERTIFICATE_VERIFY_FAILED` | `export EDGE_TTS_CA_BUNDLE=/path/to/proxy-ca.pem` (narrate.py trusts it) |
| `No audio` for a voice | voice temporarily unavailable - choose another voice of the same profile |
| Remotion cannot download its browser | `Config.setBrowserExecutable(<installed chrome-headless-shell>)` |
| Fonts fall back to system fonts | fonts must be in `public/fonts` and loaded via `@font-face` with `staticFile()`; get them with `npm pack @fontsource/...` |
| 3D renders black/empty | add `--gl=angle`; ensure lights exist; drive animation with `useCurrentFrame()` |
| Render slow | lower resolution for drafts (`--scale=0.5`), render stills first, raise concurrency on bigger machines |
| Two browser tabs of the same web app interfere (route C) | use one tab per site at a time |