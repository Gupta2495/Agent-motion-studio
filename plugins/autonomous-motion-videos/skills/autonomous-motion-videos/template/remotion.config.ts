import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(null); // auto; lower on small machines
// Offline / sandboxed machines: point Remotion at an installed headless Chromium instead of downloading one
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
