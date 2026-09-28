export type Word = { t: number; d: number; w: string };
export type SceneData = {
  id: string;
  text: string;
  audio: string;
  voiceSec: number;
  words: Word[];
  startFrame: number;
  durationFrames: number;
  voiceOffsetFrames: number;
};
export type SceneProps = { s: SceneData; n: number; total: number };

/** frame (scene-local) at which a word matching `re` is spoken; nth match (0-based) */
export const wordFrame = (s: SceneData, re: RegExp, fps = 30, nth = 0) => {
  const hits = s.words.filter((w) => re.test(w.w));
  const w = hits[Math.min(nth, hits.length - 1)];
  return w ? Math.round(s.voiceOffsetFrames + w.t * fps) : s.voiceOffsetFrames;
};
