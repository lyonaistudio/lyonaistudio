import React from "react";
import { Composition } from "remotion";
import { MainVideo, TOTAL_DURATION_SEC } from "./Video";
import { ViralVideo, TOTAL_DURATION_SEC as VIRAL_DURATION_SEC } from "./ViralVideo";
import { SitesVideo, TOTAL_DURATION_SEC as SITES_DURATION_SEC } from "./SitesVideo";
import { FPS, W, H } from "./theme";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="LyonAIStudio"
        component={MainVideo}
        durationInFrames={Math.round(TOTAL_DURATION_SEC * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="LyonAIStudioAgents"
        component={ViralVideo}
        durationInFrames={Math.round(VIRAL_DURATION_SEC * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="LyonAIStudioSites"
        component={SitesVideo}
        durationInFrames={Math.round(SITES_DURATION_SEC * FPS)}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};
