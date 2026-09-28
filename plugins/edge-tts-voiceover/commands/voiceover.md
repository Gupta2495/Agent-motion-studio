---
description: Create a voice-over with free Microsoft neural voices (asks voice profile, speed, pitch, script)
argument-hint: "[script text | path/to/script.txt]"
---

Create a voice-over using the **edge-tts-voiceover** skill.

Input from the user (may be empty): $ARGUMENTS

1. If the script text or file is missing, ask for it.
2. Ask in ONE message for anything not given: voice profile (e.g. Indian English male/female, Hindi, American, British, other language), speed (very-slow ... very-fast, default slightly-fast), pitch (deeper / natural / brighter, default natural). Mention the optional delivery tags: [pause 1s] [excited] [happy] [calm] [serious] [sad] [nervous] [soft].
3. Run the skill's `scripts/voiceover.py` (install `edge-tts` with pip first if missing) and write `voiceover.mp3` plus `voiceover.srt` in the current directory.
4. Report the file paths, duration, voice, speed and pitch, and any tags that could not be rendered.
