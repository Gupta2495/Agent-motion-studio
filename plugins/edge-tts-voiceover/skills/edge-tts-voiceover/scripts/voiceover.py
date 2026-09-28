#!/usr/bin/env python3
"""
voiceover.py - free Microsoft neural TTS (edge-tts) with voice / speed / pitch control
and inline delivery tags, plus word timings and subtitles.

Examples
  python3 voiceover.py --list en-IN                      # voices for a locale prefix (en, hi-IN, en-US, ...)
  python3 voiceover.py -v en-IN-PrabhatNeural -r +10% -p +0Hz -t "Hello there." -o hello.mp3
  python3 voiceover.py -v en-US-ChristopherNeural -r fast -p natural -f script.txt -o vo.mp3 --srt vo.srt --words vo.words.json

Inline tags (inside the script text)
  [pause 1.5s]  exact silence          [normal]   back to base delivery
  [excited] [happy] [calm] [serious] [sad] [nervous] [soft]   delivery presets (speed/pitch/volume shifts)
  [laugh] [sigh] [breath] [gasp]      non-verbal: inserts <name>.mp3/.wav from --sfx-dir if present,
                                       otherwise skipped (short pause) - edge-tts cannot synthesise them.
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
