import React from "react";
import { useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY } from "../theme";
import { Eyebrow } from "../components/Header";
import { WorkflowDiagram } from "../components/WorkflowDiagram";

export const AI1Scene: React.FC<{ subtitle: string; captionBottom?: number }> = ({ subtitle, captionBottom = 150 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const captionP = spring({ frame: frame - 60, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 60px" }}>
      <div style={{ width: "100%", marginBottom: 30, textAlign: "center" }}>
        <Eyebrow label="L'AGENT IA, CONCRÈTEMENT" appearFrame={2} style={{ textAlign: "center", width: "100%" }} />
      </div>
      <WorkflowDiagram appearFrame={6} />
      <div
        style={{
          position: "absolute",
          bottom: captionBottom,
          left: 80,
          right: 80,
          textAlign: "center",
          opacity: captionP,
        }}
      >
        <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 42, color: COLORS.paper, lineHeight: 1.25, margin: 0 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};
