#!/usr/bin/env bash
# One-time setup for a new motion video project (run inside the project folder).
set -euo pipefail
command -v node >/dev/null || { echo "Node 18+ required"; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg required (brew install ffmpeg / apt install ffmpeg / winget install ffmpeg)"; exit 1; }
python3 -c "import edge_tts" 2>/dev/null || pip install edge-tts || pip install edge-tts --break-system-packages
npm install --no-audit --no-fund --include=dev
# fonts from npm (works where Google Fonts / GitHub are blocked)
mkdir -p public/fonts .fontdl
( cd .fontdl && npm pack @fontsource/inter@5.3.0 @fontsource/space-grotesk@5.3.0 >/dev/null 2>&1 \
  && for f in *.tgz; do mkdir -p "x-${f%.tgz}" && tar xzf "$f" -C "x-${f%.tgz}"; done )
cp .fontdl/x-fontsource-inter-5.3.0/package/files/inter-latin-{400,600,800}-normal.woff2 public/fonts/
cp .fontdl/x-fontsource-space-grotesk-5.3.0/package/files/space-grotesk-latin-{500,700}-normal.woff2 public/fonts/
mkdir -p out public/audio public/images
echo "Setup done. Next: edit script.json -> npm run narrate -> npm run render"
