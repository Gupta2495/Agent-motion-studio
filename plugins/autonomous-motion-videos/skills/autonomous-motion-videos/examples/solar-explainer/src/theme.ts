import { staticFile } from "remotion";

export const W = 1920;
export const H = 1080;

export const C = {
  ink: "#F4F7FB",
  inkDim: "rgba(244,247,251,0.62)",
  navy: "#08111F",
  navy2: "#0E1C33",
  panel: "#1D3F8F",
  panelHi: "#3B6FE0",
  panelLine: "#8FB2FF",
  frame: "#C9D3E3",
  sun: "#FFC83D",
  sunCore: "#FFF3C4",
  photon: "#FFD54A",
  electron: "#56CCF2",
  dc: "#56CCF2",
  ac: "#FFB547",
  grid: "#7CF29A",
  sand: "#E7C58F",
  sandDark: "#C99A5B",
  steel: "#8A97AD",
};

export const FONT_BODY = "Inter, system-ui, sans-serif";
export const FONT_HEAD = "'Space Grotesk', Inter, sans-serif";

export const fontFaceCss = `
@font-face { font-family: 'Inter'; font-weight: 400; src: url(${staticFile("fonts/inter-latin-400-normal.woff2")}) format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 600; src: url(${staticFile("fonts/inter-latin-600-normal.woff2")}) format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 800; src: url(${staticFile("fonts/inter-latin-800-normal.woff2")}) format('woff2'); }
@font-face { font-family: 'Space Grotesk'; font-weight: 500; src: url(${staticFile("fonts/space-grotesk-latin-500-normal.woff2")}) format('woff2'); }
@font-face { font-family: 'Space Grotesk'; font-weight: 700; src: url(${staticFile("fonts/space-grotesk-latin-700-normal.woff2")}) format('woff2'); }
`;
