export type Word = { t: number; d: number; w: string };
export type SceneData = {
  id: string;
  type?: "title" | "point" | "outro" | string;
  text: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  icon?: string;
  image?: string; // file under public/, e.g. "images/evaporation.png" (route C)
  cta?: string;
  audio: string;
  voiceSec: number;
  words: Word[];
  startFrame: number;
  durationFrames: number;
  voiceOffsetFrames: number;
};
export type SceneProps = { s: SceneData; all: SceneData[]; brand?: string };

/** scene-local frame when a word matching `re` is spoken (nth match) */
export const wordFrame = (s: SceneData, re: RegExp, fps = 30, nth = 0) => {
  const hits = s.words.filter((w) => re.test(w.w));
  const w = hits[Math.min(nth, hits.length - 1)];
  return w ? Math.round(s.voiceOffsetFrames + w.t * fps) : s.voiceOffsetFrames;
};

const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9ऀ-෿]/g, "");

/**
 * Frame at which each bullet should appear: when the narration first says a significant word
 * from that bullet (after the previous bullet), otherwise evenly spaced across the voice.
 */
export const cueFrames = (s: SceneData, items: string[], fps = 30) => {
  let after = 0;
  return items.map((item, i) => {
    const keys = item.split(/\s+/).map(norm).filter((k) => k.length >= 4);
    const hit = s.words.find((w) => w.t >= after && keys.includes(norm(w.w)));
    const even = s.voiceOffsetFrames + Math.round(((i + 0.3) / items.length) * s.voiceSec * fps * 0.9);
    if (hit) { after = hit.t + 0.01; return Math.round(s.voiceOffsetFrames + hit.t * fps); }
    return even;
  });
};
