"""Generate per-scene narration with edge-tts, capture word timings, write src/timeline.json."""
import asyncio, json, ssl, subprocess
import edge_tts, edge_tts.communicate as c

import os
for _ca in (os.environ.get("EDGE_TTS_CA_BUNDLE"), os.environ.get("SSL_CERT_FILE"), "/root/.ccr/ca-bundle.crt"):
    if _ca and os.path.exists(_ca):  # only needed behind a TLS-inspecting proxy
        c._SSL_CTX = ssl.create_default_context(cafile=_ca)
        break
VOICE, RATE, FPS = "en-IN-PrabhatNeural", "-2%", 30
PAD_BEFORE, PAD_AFTER = 0.5, 0.8  # seconds of breathing room around each line

SCENES = [
    ("intro", "How does a solar power plant turn sunlight into the electricity that lights up our cities? Let's follow the energy, step by step."),
    ("field", "It starts with thousands of photovoltaic panels, laid out in long rows and tilted to face the sun."),
    ("cell", "Inside each panel are silicon cells. When photons of sunlight strike the silicon, they knock electrons loose. Those moving electrons are an electric current."),
    ("dc", "This is direct current, or D C. Cables from every row carry it to combiner boxes, which gather it together."),
    ("inverter", "But our homes run on alternating current. So an inverter flips the flow back and forth, fifty times every second, turning D C into smooth A C."),
    ("transformer", "Next, a step-up transformer raises the voltage, from a few hundred volts to over a hundred thousand, so the power can travel far with very little loss."),
    ("grid", "High-voltage lines carry it across the grid. And as evening falls, the city lights up, powered by the sun."),
    ("recap", "Sunlight. Solar cells. Inverter. Transformer. Grid. That's how a solar power plant works."),
]


async def gen(sid, text):
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    words, audio = [], bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({"t": chunk["offset"] / 1e7, "d": chunk["duration"] / 1e7, "w": chunk["text"]})
    path = f"public/audio/{sid}.mp3"
    open(path, "wb").write(audio)
    dur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode())
    return {"id": sid, "text": text, "audio": f"audio/{sid}.mp3", "voiceSec": dur, "words": words}


async def main():
    scenes, start = [], 0
    for sid, text in SCENES:
        s = await gen(sid, text)
        frames = round((PAD_BEFORE + s["voiceSec"] + PAD_AFTER) * FPS)
        s.update(startFrame=start, durationFrames=frames, voiceOffsetFrames=round(PAD_BEFORE * FPS))
        start += frames
        scenes.append(s)
        print(f"{sid:12s} voice {s['voiceSec']:5.2f}s  scene {frames/FPS:5.2f}s  words {len(s['words'])}")
    json.dump({"fps": FPS, "totalFrames": start, "scenes": scenes}, open("src/timeline.json", "w"), indent=1)
    print(f"TOTAL {start/FPS:.1f}s ({start} frames)")


asyncio.run(main())
