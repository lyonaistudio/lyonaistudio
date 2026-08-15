import React from "react";
import { Composition } from "remotion";
import { MainVideo, TOTAL_DURATION_SEC } from "./Video";
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
    </>
  );
};
