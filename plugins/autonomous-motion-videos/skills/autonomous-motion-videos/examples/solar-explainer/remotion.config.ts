import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(null);
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
