import React from "react";
import { Composition } from "remotion";
import timeline from "./timeline.json";
import { Main } from "./Video";

// 16:9 by default. For Reels/Shorts use width 1080, height 1920 and adapt scene layouts.
export const RemotionRoot: React.FC = () => (
  <Composition id="Main" component={Main} durationInFrames={Math.max(1, timeline.totalFrames)} fps={timeline.fps} width={1920} height={1080} />
);
