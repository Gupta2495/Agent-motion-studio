# Reference build: "How a Solar Power Plant Works" (96 s, 8 bespoke scenes)

Full source of the reference explainer (React + SVG in Remotion, Microsoft neural TTS "en-IN-PrabhatNeural").
Scenes: `src/scenes/Scenes1.tsx` (intro, PV field, silicon-cell cutaway) and `Scenes2.tsx` (DC/combiner, inverter, transformer, grid at dusk, recap).
`src/Turbine3D.tsx` is the Three.js smoke-test scene (render with `--gl=angle`).

Run:
```bash
npm install
# fonts: copy public/fonts from the template after running its setup.sh, or run the same npm-pack commands
python3 make_voice.py             # narration -> public/audio + src/timeline.json
npx remotion render src/index.ts SolarExplainer out/solar-explainer.mp4 --codec=h264 --crf=18
```
