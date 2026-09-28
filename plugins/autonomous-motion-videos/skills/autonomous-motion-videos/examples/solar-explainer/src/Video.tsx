import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import timeline from "./timeline.json";
import { fontFaceCss } from "./theme";
import { Captions, SceneFade } from "./components/common";
import { Intro, Field, Cell } from "./scenes/Scenes1";
import { DC, Inverter, Transformer, Grid, Recap } from "./scenes/Scenes2";
import { SceneData } from "./scenes/types";

const MAP: Record<string, React.FC<any>> = { intro: Intro, field: Field, cell: Cell, dc: DC, inverter: Inverter, transformer: Transformer, grid: Grid, recap: Recap };

export const SolarExplainer: React.FC = () => {
  const scenes = timeline.scenes as SceneData[];
  const numbered = scenes.filter((s) => s.id !== "intro" && s.id !== "recap");
  return (
    <AbsoluteFill style={{ background: "#08111F" }}>
      <style>{fontFaceCss}</style>
      {scenes.map((s) => {
        const Comp = MAP[s.id];
        const n = numbered.findIndex((x) => x.id === s.id) + 1;
        return (
          <Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationFrames} name={s.id}>
            <SceneFade dur={s.durationFrames}>
              <Comp s={s} n={n} total={numbered.length} />
            </SceneFade>
            <Captions words={s.words} offsetFrames={s.voiceOffsetFrames} />
            <Sequence from={s.voiceOffsetFrames}>
              <Audio src={staticFile(s.audio)} />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
