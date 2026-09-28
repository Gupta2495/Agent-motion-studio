import React from "react";
import { Composition } from "remotion";
import timeline from "./timeline.json";
import { SolarExplainer } from "./Video";
import { Turbine3D } from "./Turbine3D";

export const RemotionRoot: React.FC = () => (
  <>
  <Composition id="Turbine3D" component={Turbine3D} durationInFrames={150} fps={30} width={1920} height={1080} />
  <Composition id="SolarExplainer" component={SolarExplainer} durationInFrames={timeline.totalFrames} fps={timeline.fps} width={1920} height={1080} />
  </>
);
