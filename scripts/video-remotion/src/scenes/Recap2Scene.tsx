import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../theme";

export const Recap2Scene: React.FC<{ subtitle: string }> = ({ subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dotAP = spring({ frame, fps, config: { damping: 200 } });
  const dotBP = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const lineP = interpolate(frame, [12, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const captionP = spring({ frame: frame - 46, fps, config: { damping: 200 } });

  const W_LINE = 720;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "relative", width: W_LINE, height: 80, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: dotAP, transform: `scale(${dotAP})` }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, border: `2px solid ${COLORS.paper}` }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.paper }}>VOUS</span>
        </div>

        <svg width={W_LINE - 120} height={4} style={{ position: "absolute", left: 60, top: 13 }}>
          <line
            x1={0}
            y1={2}
            x2={(W_LINE - 120) * lineP}
            y2={2}
            stroke={COLORS.accent}
            strokeWidth={2}
            strokeDasharray="8 8"
          />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: dotBP, transform: `scale(${dotBP})` }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, border: `2px solid ${COLORS.accent}`, background: `rgba(226,103,44,0.15)` }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.accent }}>LYON AI STUDIO</span>
        </div>
      </div>

      <div style={{ marginTop: 70, textAlign: "center", opacity: captionP, transform: `translateY(${(1 - captionP) * 16}px)`, padding: "0 90px" }}>
        <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 42, color: COLORS.paper, lineHeight: 1.25, margin: 0 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};
