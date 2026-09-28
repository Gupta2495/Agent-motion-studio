import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import timeline from "./timeline.json";
import { C, fontFaceCss } from "./theme";
import { Captions, SceneFade } from "./components/common";
import { SceneData } from "./scenes/types";
import { SCENES } from "./scenes";

export const Main: React.FC = () => {
  const scenes = timeline.scenes as unknown as SceneData[];
  const meta = ((timeline as any).meta ?? {}) as { brand?: string; captions?: boolean };
  return (
    <AbsoluteFill style={{ background: C.bg2 }}>
      <style>{fontFaceCss}</style>
      {scenes.map((s) => {
        const Scene = SCENES[s.type ?? s.id] ?? SCENES.point;
        return (
          <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationFrames} name={s.id}>
            <SceneFade dur={s.durationFrames}>
              <Scene s={s} all={scenes} brand={meta.brand} />
            </SceneFade>
            {meta.captions !== false && <Captions words={s.words} offsetFrames={s.voiceOffsetFrames} />}
            <Sequence from={s.voiceOffsetFrames}>
              <Audio src={staticFile(s.audio)} />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
