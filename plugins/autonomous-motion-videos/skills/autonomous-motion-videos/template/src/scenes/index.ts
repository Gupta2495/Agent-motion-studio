import React from "react";
import { SceneProps } from "./types";
import { OutroScene, PointScene, TitleScene } from "./Scenes";

/**
 * Scene registry. A scene in script.json picks its component by "type" (or by "id" if no type).
 * Add custom scenes here, e.g. { "solar-cell": SolarCellScene, "turbine3d": Turbine3DScene }.
 */
export const SCENES: Record<string, React.FC<SceneProps>> = {
  title: TitleScene,
  point: PointScene,
  outro: OutroScene,
};
