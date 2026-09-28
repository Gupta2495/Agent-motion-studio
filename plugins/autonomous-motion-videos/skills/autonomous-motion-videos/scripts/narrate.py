#!/usr/bin/env python3
"""
narrate.py - script.json -> public/audio/<id>.mp3 + src/timeline.json (+ optional SRT / merged MP3)
Free Microsoft neural voices via edge-tts, with word-level timings for captions and animation sync.

Usage (from the video project root):
  python3 narrate.py script.json --out public --fps 30 [--timeline src/timeline.json] [--srt out/narration.srt] [--merged out/narration.mp3]

script.json:
  {
    "voice": "en-IN-PrabhatNeural", "rate": "+10%", "pitch": "+0Hz", "volume": "+0%",
    "padBefore": 0.5, "padAfter": 0.8,
    "scenes": [
      {"id": "intro", "type": "title", "title": "How X Works", "text": "Narration for this scene..."},
      {"id": "step1", "type": "point", "title": "Step one", "bullets": ["a", "b"], "text": "...", "voice": "hi-IN-SwaraNeural"}
    ]
  }
Any extra scene fields (type, title, bullets, image, ...) are copied into timeline.json for the scene components.
Per-scene overrides: voice, rate, pitch, volume.
"""
import argparse, asyncio, json, os, ssl, subprocess, sys

import edge_tts
import edge_tts.communicate as _comm

RESERVED = {"voice", "rate", "pitch", "volume"}


def _patch_ssl():
    """Behind a TLS-inspecting proxy, trust its CA bundle (verification stays on)."""
    for ca in (os.environ.get("EDGE_TTS_CA_BUNDLE"), os.environ.get("SSL_CERT_FILE"), "/root/.ccr/ca-bundle.crt"):
        if ca and os.path.exists(ca):
            _comm._SSL_CTX = ssl.create_default_context(cafile=ca)
            return


def _dur(p):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())


async def _speak(text, voice, rate, pitch, volume, path):
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=volume, boundary="WordBoundary")
    audio, words = bytearray(), []
    async for ch in comm.stream():
        if ch["type"] == "audio":
            audio.extend(ch["data"])
        elif ch["type"] == "WordBoundary":
            words.append({"t": round(ch["offset"] / 1e7, 3), "d": round(ch["duration"] / 1e7, 3), "w": ch["text"]})
    if not audio:
        raise RuntimeError(f"No audio for {path} - check the voice name (edge-tts --list-voices), retry, or pick another voice")
    with open(path, "wb") as fh:
        fh.write(audio)
    return words


def _t(s):
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def _lines(words, max_chars=44, pause=0.28):
    lines, cur, n = [], [], 0
    for i, w in enumerate(words):
        gap = w["t"] - (words[i - 1]["t"] + words[i - 1]["d"]) if i else 0
        if cur and (n + len(w["w"]) > max_chars or gap > pause):
            lines.append(cur); cur, n = [], 0
        cur.append(w); n += len(w["w"]) + 1
    if cur:
        if lines and len(cur) <= 2 and cur[0]["t"] - (lines[-1][-1]["t"] + lines[-1][-1]["d"]) <= pause:
            lines[-1].extend(cur)
        else:
            lines.append(cur)
    return lines


async def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script")
    ap.add_argument("--out", default="public", help="folder that receives audio/ (Remotion: public)")
    ap.add_argument("--timeline", default="src/timeline.json")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--srt")
    ap.add_argument("--merged", help="one continuous MP3 aligned to the timeline")
    a = ap.parse_args()
    _patch_ssl()

    cfg = json.load(open(a.script, encoding="utf-8"))
    os.makedirs(os.path.join(a.out, "audio"), exist_ok=True)
    pb, pa, fps = cfg.get("padBefore", 0.5), cfg.get("padAfter", 0.8), a.fps
    scenes, start = [], 0
    for sc in cfg["scenes"]:
        g = lambda k, d: sc.get(k, cfg.get(k, d))
        voice, rel = g("voice", "en-IN-PrabhatNeural"), f"audio/{sc['id']}.mp3"
        words = await _speak(sc["text"], voice, g("rate", "+0%"), g("pitch", "+0Hz"), g("volume", "+0%"), os.path.join(a.out, rel))
        vsec = _dur(os.path.join(a.out, rel))
        frames = round((pb + vsec + pa) * fps)
        extra = {k: v for k, v in sc.items() if k not in RESERVED and k not in ("id", "text")}
        scenes.append({"id": sc["id"], "text": sc["text"], **extra, "voice": voice, "audio": rel, "voiceSec": round(vsec, 3),
                       "words": words, "startFrame": start, "durationFrames": frames, "voiceOffsetFrames": round(pb * fps)})
        print(f"{sc['id']:14s} {voice:26s} voice {vsec:6.2f}s  scene {frames / fps:6.2f}s", file=sys.stderr)
        start += frames

    os.makedirs(os.path.dirname(a.timeline) or ".", exist_ok=True)
    meta = {k: v for k, v in cfg.items() if k != "scenes"}
    json.dump({"fps": fps, "totalFrames": start, "meta": meta, "scenes": scenes}, open(a.timeline, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"TOTAL {start / fps:.1f}s ({start} frames) -> {a.timeline}", file=sys.stderr)

    if a.srt:
        out, i = [], 1
        for s in scenes:
            base, L = (s["startFrame"] + s["voiceOffsetFrames"]) / fps, _lines(s["words"])
            for k, ln in enumerate(L):
                t0, t1 = base + ln[0]["t"], base + ln[-1]["t"] + ln[-1]["d"] + 0.15
                if k + 1 < len(L):
                    t1 = min(t1, base + L[k + 1][0]["t"] - 0.02)
                out.append(f"{i}\n{_t(t0)} --> {_t(t1)}\n{' '.join(w['w'] for w in ln)}\n")
                i += 1
        os.makedirs(os.path.dirname(a.srt) or ".", exist_ok=True)
        open(a.srt, "w", encoding="utf-8").write("\n".join(out))
        print(f"srt -> {a.srt}", file=sys.stderr)

    if a.merged:
        ins, flt = [], []
        for i, s in enumerate(scenes):
            ins += ["-i", os.path.join(a.out, s["audio"])]
            ms = int(round((s["startFrame"] + s["voiceOffsetFrames"]) / fps * 1000))
            flt.append(f"[{i}]adelay={ms}|{ms}[a{i}]")
        flt.append("".join(f"[a{i}]" for i in range(len(scenes))) + f"amix=inputs={len(scenes)}:normalize=0,apad=whole_dur={start / fps}[o]")
        os.makedirs(os.path.dirname(a.merged) or ".", exist_ok=True)
        subprocess.check_call(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(flt), "-map", "[o]", "-t", f"{start / fps}", a.merged])
        print(f"merged -> {a.merged}", file=sys.stderr)


if __name__ == "__main__":
    asyncio.run(main())
