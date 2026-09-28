import { staticFile } from "remotion";

export const W = 1920;
export const H = 1080;

// Change these to rebrand the whole video.
export const C = {
  ink: "#F4F7FB",
  inkDim: "rgba(244,247,251,0.62)",
  bg1: "#13254A",
  bg2: "#08111F",
  accent: "#FFC83D",
  blue: "#56CCF2",
  amber: "#FFB547",
  green: "#7CF29A",
  grid: "#8FB2FF",
};

export const FONT_BODY = "Inter, system-ui, sans-serif";
export const FONT_HEAD = "'Space Grotesk', Inter, sans-serif";

export const fontFaceCss = (
  [
    ["Inter", 400, "inter-latin-400-normal"],
    ["Inter", 600, "inter-latin-600-normal"],
    ["Inter", 800, "inter-latin-800-normal"],
    ["Space Grotesk", 500, "space-grotesk-latin-500-normal"],
    ["Space Grotesk", 700, "space-grotesk-latin-700-normal"],
  ] as [string, number, string][]
)
  .map(([f, w, file]) => `@font-face{font-family:'${f}';font-weight:${w};src:url(${staticFile(`fonts/${file}.woff2`)}) format('woff2');}`)
  .join("\n");
