# edge-tts-voiceover: free AI voice-overs for any agent

This is an agent skill (Claude, Codex, Gemini CLI, Antigravity, Cursor) that generates natural voice-overs with **Microsoft neural voices**, free with no API key.

The agent asks four things, then generates the audio:
1. **Voice profile:** Indian English, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Urdu, American, British, Australian, and 140+ languages and accents in total
2. **Speed:** very slow … very fast (or an exact %)
3. **Pitch:** much deeper … much brighter (or exact Hz)
4. **Script:** with optional delivery tags: `[pause 1.5s]` `[excited]` `[happy]` `[calm]` `[serious]` `[sad]` `[nervous]` `[soft]`

Output: MP3/WAV, SRT subtitles and word-level timings (JSON).

Hear it in [`samples/`](../../samples):
- Indian English (Prabhat)
- US English (Christopher)
- the emotion-tag demo

## Install

**Claude Code (plugin):**
```
/plugin marketplace add Gupta2495/Agent-motion-studio
/plugin install edge-tts-voiceover@agent-motion-studio
```
**Any agent (Codex, Gemini CLI, Cursor, Antigravity, Claude Code...):**
```
npx skills add Gupta2495/Agent-motion-studio --skill edge-tts-voiceover
```
**Claude.ai / Claude desktop:** upload [`dist/edge-tts-voiceover.zip`](../../dist/edge-tts-voiceover.zip) in Settings → Capabilities → Skills.

Requirements: Python 3 + `pip install edge-tts`, ffmpeg.


## Use

Ask your agent, e.g. *"Make a voice-over of this script, calm Indian male voice, slightly fast."*

Or run the script directly:
```bash
python3 scripts/voiceover.py --list en-IN
python3 scripts/voiceover.py -v hi-IN-SwaraNeural -r normal -p natural -f script.txt -o voiceover.mp3 --srt voiceover.srt
```

## Limits

- **Emotions:** pauses and tone shifts work. Real laughing, sighing or whispering do not, because the free endpoint accepts plain text only. `[laugh]` / `[sigh]` insert your own sound files via `--sfx-dir`, and are skipped otherwise.
- **Voices:** a voice can occasionally stop responding. Pick another of the same profile.
- **Endpoint:** it uses Microsoft's free Edge read-aloud service. `pip install -U edge-tts` if it ever breaks.
