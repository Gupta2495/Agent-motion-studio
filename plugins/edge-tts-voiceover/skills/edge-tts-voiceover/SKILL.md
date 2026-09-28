---
name: edge-tts-voiceover
description: "Free voice-overs with Microsoft neural voices (edge-tts): asks voice profile, speed, pitch and script; supports delivery tags, pauses, subtitles and word timings."
---

# Edge-TTS Voice-over

Generate natural voice-overs for free using **Microsoft's neural voices** (the engine behind Edge "Read aloud") via the open-source `edge-tts` library. No API key, no account. ~320 voices across ~140 languages/accents, including 21 Indian voices in 10 languages.

Works in any agent that can run a shell (Claude, Codex, Gemini CLI, Antigravity, Cursor, etc.). Output: an MP3 (or WAV) plus optional SRT subtitles and word-level timings for syncing video, captions or animations.

Use this skill whenever someone wants narration, a voice-over, text-to-speech, a talking script, audio for a video/reel/explainer, or subtitles timed to speech.

## Bundled files (use these first)

- `scripts/voiceover.py` - the ready-to-run generator (identical to Step 4 below). Run it from anywhere:
  `python3 <this-skill-folder>/scripts/voiceover.py -v en-IN-PrabhatNeural -r slightly-fast -p natural -t "Hello" -o hello.mp3`
- `examples/demo-script.txt` - a script that exercises every delivery tag.

If the scripts folder is missing (e.g. only SKILL.md was copied), write the script from Step 4.

## Step 1 - Ask the user four things

Ask these together (offer the options; accept free-form answers too). If the user already gave some, only ask for the rest.

1. **Voice profile** - accent/country, language, gender, vibe. Examples to offer:
   - Indian English (male Prabhat / female Neerja), Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Urdu
   - American (Christopher, Guy, Brian, Eric / Aria, Jenny, Ava, Emma), British (Ryan, Thomas / Sonia, Libby), Australian, Canadian, Irish, other languages
   - Vibe: calm narrator, energetic presenter, warm storyteller, serious/news
2. **Speed** - very slow, slow, normal, slightly fast, fast, very fast (or an exact % like +12%). Recommend *slightly fast (+8%)* to *fast (+15%)* for explainers and reels.
3. **Pitch** - much deeper, deeper, natural, brighter, much brighter (or exact Hz like -4Hz). Recommend *natural*.
4. **Script** - the exact text. Tell them they can add inline tags for delivery (see Step 3). For Indian languages, write the script in the native script (Devanagari, Tamil, etc.).

Then offer a quick sample of the first sentence before generating the whole thing if the script is long (over ~1 minute of speech).

## Step 2 - Setup (once)

```bash
pip install edge-tts              # use --break-system-packages on system Python if needed
# ffmpeg + ffprobe are required:
#   macOS: brew install ffmpeg   Ubuntu/Debian: sudo apt install ffmpeg   Windows: winget install ffmpeg
```

Save the script from Step 4 as `voiceover.py`.

## Step 3 - Map answers to settings

### Voice catalog (verified ids)

| Profile | Male | Female |
|---|---|---|
| Indian English `en-IN` | en-IN-PrabhatNeural | en-IN-NeerjaNeural, en-IN-NeerjaExpressiveNeural (more emotive) |
| Hindi | hi-IN-MadhurNeural | hi-IN-SwaraNeural |
| Bengali | bn-IN-BashkarNeural | bn-IN-TanishaaNeural |
| Tamil | ta-IN-ValluvarNeural | ta-IN-PallaviNeural |
| Telugu | te-IN-MohanNeural | te-IN-ShrutiNeural |
| Marathi | mr-IN-ManoharNeural | mr-IN-AarohiNeural |
| Gujarati | gu-IN-NiranjanNeural | gu-IN-DhwaniNeural |
| Kannada | kn-IN-GaganNeural | kn-IN-SapnaNeural |
| Malayalam | ml-IN-MidhunNeural | ml-IN-SobhanaNeural |
| Urdu (India) | ur-IN-SalmanNeural | ur-IN-GulNeural |
| American `en-US` | en-US-ChristopherNeural (calm narrator), en-US-GuyNeural, en-US-BrianNeural, en-US-EricNeural, en-US-RogerNeural, en-US-SteffanNeural | en-US-AriaNeural, en-US-JennyNeural, en-US-AvaNeural, en-US-EmmaNeural, en-US-MichelleNeural |
| British `en-GB` | en-GB-RyanNeural, en-GB-ThomasNeural | en-GB-SoniaNeural, en-GB-LibbyNeural, en-GB-MaisieNeural |
| Australian | en-AU-WilliamMultilingualNeural | en-AU-NatashaNeural |
| Canadian | en-CA-LiamNeural | en-CA-ClaraNeural |
| Irish | en-IE-ConnorNeural | en-IE-EmilyNeural |
| New Zealand | en-NZ-MitchellNeural | en-NZ-MollyNeural |
| Singapore | en-SG-WayneNeural | en-SG-LunaNeural |
| South African | en-ZA-LukeNeural | en-ZA-LeahNeural |
| Spanish (Spain / Mexico) | es-ES-AlvaroNeural / es-MX-JorgeNeural | es-ES-ElviraNeural / es-MX-DaliaNeural |
| French | fr-FR-HenriNeural | fr-FR-DeniseNeural |
| German | de-DE-ConradNeural, de-DE-KillianNeural | de-DE-KatjaNeural, de-DE-AmalaNeural |
| Portuguese (Brazil) | pt-BR-AntonioNeural | pt-BR-FranciscaNeural |
| Arabic (Saudi) | ar-SA-HamedNeural | ar-SA-ZariyahNeural |
| Japanese | ja-JP-KeitaNeural | ja-JP-NanamiNeural |
| Chinese (Mandarin) | zh-CN-YunxiNeural, zh-CN-YunjianNeural | zh-CN-XiaoxiaoNeural, zh-CN-XiaoyiNeural |

Any other language/accent: `python3 voiceover.py --list <prefix>` (e.g. `--list ko`, `--list it-IT`, `--list en`).
Note: a voice can occasionally stop returning audio (seen with the en-US-Andrew voices). If generation fails with "No audio", pick another voice of the same profile.

### Speed and pitch presets

| Speed word | rate | | Pitch word | pitch |
|---|---|---|---|---|
| very-slow | -20% | | much-deeper | -12Hz |
| slow | -10% | | deeper | -6Hz |
| normal | +0% | | natural | +0Hz |
| slightly-fast | +8% | | brighter | +6Hz |
| fast | +15% | | much-brighter | +12Hz |
| very-fast | +25% | | | |

**Speed = rate** (how fast). **Pitch** only makes the voice higher/lower - it does not change speed. Reference: a 17-word line took 9.4s at -2%, 8.35s at +10%, 7.7s at +20%. Beyond +25% sounds rushed; beyond +/-12Hz sounds unnatural.

### Delivery tags (emotions, pauses) - what works and what does not

The free Microsoft endpoint accepts **plain text only**: SSML and Azure speaking styles (cheerful, sad, whispering...) are NOT available - tags like `<break>` or `<mstts:express-as>` get read aloud. This skill therefore emulates delivery by splitting the script at tags and changing speed/pitch/volume per segment.

| Tag | Effect | Quality |
|---|---|---|
| `[pause 1.5s]` | exact silence of that length | exact |
| `[excited]` | faster, higher pitch | good |
| `[happy]` | slightly faster, brighter | good |
| `[calm]` | slower, slightly deeper, softer | good |
| `[serious]` | slower, deeper | good |
| `[sad]` | much slower, deeper, quieter | approximate |
| `[nervous]` | faster, higher, softer - pair with written hesitation: "Um, I... I think so?" | approximate |
| `[soft]` | slow and quiet (closest to a whisper; not a true whisper) | approximate |
| `[normal]` | back to the base settings | - |
| `[laugh]` `[sigh]` `[breath]` `[gasp]` | **cannot be synthesised** by this engine. Inserts `<name>.mp3/.wav` from `--sfx-dir` if provided, otherwise a short pause (with a warning). | needs SFX files |

A delivery tag applies to all text after it until the next delivery tag. Tell the user honestly: pauses and tone shifts work; real laughing, sighing, crying or whispering do not - for those, provide short sound-effect files, or use a paid expressive TTS.

Writing tips that improve realism:
- Punctuation shapes delivery: commas = short pause, full stop = ~0.5s, "..." = hesitation, "?" = rising tone.
- Write hesitations and fillers literally ("Um,", "Well...", "I... I").
- Spell out acronyms as they should be spoken ("D C", "A I") and numbers as words where pronunciation matters.

## Step 4 - The script (save verbatim as voiceover.py)

```python
#!/usr/bin/env python3
"""
voiceover.py - free Microsoft neural TTS (edge-tts) with voice / speed / pitch control
and inline delivery tags, plus word timings and subtitles.

Examples
  python3 voiceover.py --list en-IN
  python3 voiceover.py -v en-IN-PrabhatNeural -r +10% -p +0Hz -t "Hello there." -o hello.mp3
  python3 voiceover.py -v en-US-ChristopherNeural -r fast -p natural -f script.txt -o vo.mp3 --srt vo.srt --words vo.words.json

Inline tags
  [pause 1.5s]  exact silence          [normal]   back to base delivery
  [excited] [happy] [calm] [serious] [sad] [nervous] [soft]   delivery presets (speed/pitch/volume shifts)
  [laugh] [sigh] [breath] [gasp]      inserts <name>.mp3/.wav from --sfx-dir if present, else skipped (short pause)
"""
import argparse, asyncio, json, os, re, ssl, subprocess, sys, tempfile

import edge_tts
import edge_tts.communicate as _comm

SPEED = {"very-slow": -20, "slow": -10, "normal": 0, "slightly-fast": 8, "fast": 15, "very-fast": 25}
PITCH = {"much-deeper": -12, "deeper": -6, "natural": 0, "brighter": 6, "much-brighter": 12}
# (rate %, pitch Hz, volume %) shifts added on top of the base settings
PRESETS = {
    "normal": (0, 0, 0), "excited": (12, 8, 0), "happy": (6, 5, 0), "calm": (-8, -3, -5),
    "serious": (-5, -5, 0), "sad": (-15, -8, -15), "nervous": (8, 6, -5), "soft": (-10, -2, -35),
}
NONVERBAL = {"laugh", "sigh", "breath", "gasp"}
TAG = re.compile(r"\[(\w+)(?:\s+([\d.]+)\s*s?)?\]")


def patch_ssl():
    """Behind a TLS-inspecting proxy, trust its CA bundle (verification stays on)."""
    for ca in (os.environ.get("EDGE_TTS_CA_BUNDLE"), os.environ.get("SSL_CERT_FILE"), "/root/.ccr/ca-bundle.crt"):
        if ca and os.path.exists(ca):
            _comm._SSL_CTX = ssl.create_default_context(cafile=ca)
            return


def num(v, table, unit):
    """'fast' | '+15%' | '15' | '-6Hz' -> int"""
    v = str(v).strip().lower()
    if v in table:
        return table[v]
    return int(float(v.replace(unit.lower(), "").replace("+", "") or 0))


def fmt(n, unit):
    return f"{'+' if n >= 0 else ''}{n}{unit}"


def parse(script):
    """-> list of ('speech', text, preset) | ('pause', seconds) | ('sfx', name)"""
    parts, preset, pos = [], "normal", 0
    for m in TAG.finditer(script):
        text = script[pos:m.start()].strip()
        if text:
            parts.append(("speech", text, preset))
        name, arg = m.group(1).lower(), m.group(2)
        if name == "pause":
            parts.append(("pause", float(arg or 0.6)))
        elif name in PRESETS:
            preset = name
        elif name in NONVERBAL:
            parts.append(("sfx", name))
        else:
            print(f"! unknown tag [{name}] ignored", file=sys.stderr)
        pos = m.end()
    text = script[pos:].strip()
    if text:
        parts.append(("speech", text, preset))
    return parts


def run(*cmd):
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def duration(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode())


async def speak(text, voice, rate, pitch, vol, path):
    comm = edge_tts.Communicate(text, voice, rate=fmt(rate, "%"), pitch=fmt(pitch, "Hz"),
                                volume=fmt(vol, "%"), boundary="WordBoundary")
    audio, words = bytearray(), []
    async for ch in comm.stream():
        if ch["type"] == "audio":
            audio.extend(ch["data"])
        elif ch["type"] == "WordBoundary":
            words.append({"t": ch["offset"] / 1e7, "d": ch["duration"] / 1e7, "w": ch["text"]})
    if not audio:
        raise RuntimeError(f"No audio for voice {voice} - check the name with --list, or retry (voices are occasionally unavailable)")
    open(path, "wb").write(audio)
    return words


def srt_time(s):
    ms = int(round(s * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def caption_lines(words, max_chars=44, pause=0.28):
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


async def list_voices(prefix):
    for v in sorted(await edge_tts.list_voices(), key=lambda v: v["ShortName"]):
        if v["ShortName"].lower().startswith(prefix.lower()):
            tags = ", ".join(v.get("VoiceTag", {}).get("VoicePersonalities", []))
            print(f"{v['ShortName']:34s} {v['Gender']:7s} {tags}")


async def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--list", metavar="PREFIX", help="list voices whose id starts with PREFIX (e.g. en-IN, hi, en-US)")
    ap.add_argument("-v", "--voice", default="en-IN-PrabhatNeural")
    ap.add_argument("-r", "--rate", default="normal", help="very-slow|slow|normal|slightly-fast|fast|very-fast or +15%%")
    ap.add_argument("-p", "--pitch", default="natural", help="much-deeper|deeper|natural|brighter|much-brighter or +6Hz")
    ap.add_argument("--volume", default="+0%")
    ap.add_argument("-t", "--text")
    ap.add_argument("-f", "--file", help="script file (UTF-8, may contain tags)")
    ap.add_argument("-o", "--out", default="voiceover.mp3")
    ap.add_argument("--srt")
    ap.add_argument("--words", help="write word timings JSON")
    ap.add_argument("--sfx-dir", help="folder with laugh/sigh/breath/gasp .mp3|.wav to insert for those tags")
    a = ap.parse_args()
    patch_ssl()

    if a.list:
        return await list_voices(a.list)
    script = a.text if a.text is not None else (open(a.file, encoding="utf-8").read() if a.file else None)
    if not script:
        ap.error("give --text or --file (or --list)")

    base_r, base_p, base_v = num(a.rate, SPEED, "%"), num(a.pitch, PITCH, "Hz"), num(a.volume, {}, "%")
    tmp = tempfile.mkdtemp(prefix="vo_")
    pieces, words, t = [], [], 0.0
    fmt_args = ["-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le"]

    for i, part in enumerate(parse(script)):
        wav = os.path.join(tmp, f"{i:03d}.wav")
        if part[0] == "speech":
            _, text, preset = part
            dr, dp, dv = PRESETS[preset]
            mp3 = os.path.join(tmp, f"{i:03d}.mp3")
            ws = await speak(text, a.voice, base_r + dr, base_p + dp, max(-100, base_v + dv), mp3)
            run("ffmpeg", "-y", "-i", mp3, *fmt_args, wav)
            words += [{**w, "t": round(t + w["t"], 3), "d": round(w["d"], 3)} for w in ws]
        elif part[0] == "pause":
            run("ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(part[1]), *fmt_args, wav)
        else:  # non-verbal sound effect
            src = next((os.path.join(a.sfx_dir, part[1] + e) for e in (".mp3", ".wav")
                        if a.sfx_dir and os.path.exists(os.path.join(a.sfx_dir, part[1] + e))), None)
            if src:
                run("ffmpeg", "-y", "-i", src, *fmt_args, wav)
            else:
                print(f"! [{part[1]}] not synthesisable by edge-tts and no sfx file - inserted 0.35s pause", file=sys.stderr)
                run("ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.35", *fmt_args, wav)
        pieces.append(wav)
        t += duration(wav)

    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in pieces))
    codec = ["-c:a", "libmp3lame", "-q:a", "2"] if a.out.lower().endswith(".mp3") else []
    run("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, *codec, a.out)
    print(f"audio  -> {a.out}  ({duration(a.out):.2f}s, voice {a.voice}, rate {fmt(base_r, '%')}, pitch {fmt(base_p, 'Hz')})", file=sys.stderr)

    if a.words:
        json.dump(words, open(a.words, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
        print(f"words  -> {a.words}", file=sys.stderr)
    if a.srt:
        lines, out = caption_lines(words), []
        for k, ln in enumerate(lines):
            t0, t1 = ln[0]["t"], ln[-1]["t"] + ln[-1]["d"] + 0.15
            if k + 1 < len(lines):
                t1 = min(t1, lines[k + 1][0]["t"] - 0.02)
            out.append(f"{k + 1}\n{srt_time(t0)} --> {srt_time(t1)}\n{' '.join(w['w'] for w in ln)}\n")
        open(a.srt, "w", encoding="utf-8").write("\n".join(out))
        print(f"srt    -> {a.srt}", file=sys.stderr)


if __name__ == "__main__":
    asyncio.run(main())
```

## Step 5 - Generate

```bash
# short text
python3 voiceover.py -v en-IN-PrabhatNeural -r slightly-fast -p natural -t "Your text here." -o voiceover.mp3

# script file with tags, subtitles and word timings
python3 voiceover.py -v en-US-ChristopherNeural -r fast -p natural -f script.txt \
  -o voiceover.mp3 --srt voiceover.srt --words voiceover.words.json

# with real laugh/sigh sound effects (laugh.mp3, sigh.mp3 ... in ./sfx)
python3 voiceover.py -v en-IN-NeerjaExpressiveNeural -f script.txt -o vo.mp3 --sfx-dir ./sfx
```

Example `script.txt`:

```text
[calm] Welcome back to the channel. [pause 0.8s]
[excited] Today we're building something amazing! [laugh]
[nervous] Um, I... I hope the demo works this time. [sigh]
[sad] Last time, it crashed right in front of everyone. [pause 1s]
[serious] But we fixed the bug. [normal] So let's get started.
```

Report back to the user: output file path(s), total duration, voice, speed, pitch, and any tags that were skipped (the script prints warnings for [laugh]/[sigh] without SFX).

## Outputs

- `voiceover.mp3` - the narration (use `.wav` extension for uncompressed).
- `--srt` - subtitles split on natural pauses (burn into video: `ffmpeg -i video.mp4 -i voiceover.mp3 -vf subtitles=voiceover.srt -map 0:v -map 1:a -c:v libx264 -c:a aac out.mp4`).
- `--words` - JSON `[{"t": start_sec, "d": dur_sec, "w": "word"}]` for karaoke captions or triggering animations on specific words (e.g. in Remotion: frame = round(t * fps)). Words carry no punctuation.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `CERTIFICATE_VERIFY_FAILED` (corporate proxy / sandbox) | `export EDGE_TTS_CA_BUNDLE=/path/to/proxy-ca.pem` - the script trusts it; never disable verification |
| `No audio` for one voice | Voice temporarily unavailable or misspelled - check `--list`, pick another voice of the same profile |
| 403 / handshake errors for all voices | `pip install -U edge-tts` (Microsoft rotates tokens; updates fix it) |
| Tags spoken aloud | Only the square-bracket tags above are supported; SSML is not |
| Sounds slow | Raise speed (rate) to +8...+15%; pitch does not change speed |
| Hindi/Indic words mispronounced | Write the script in the native script, not Latin transliteration |