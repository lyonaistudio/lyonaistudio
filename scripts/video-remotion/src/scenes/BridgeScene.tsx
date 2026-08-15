import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_DISPLAY } from "../theme";

export const BridgeScene: React.FC<{ subtitle: string }> = ({ subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoP = spring({ frame, fps, config: { damping: 9, stiffness: 90 } });
  const ringP = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const rotate = frame * 0.6;
  const pulse = 1 + 0.05 * Math.sin(frame / 7);
  const captionP = spring({ frame: frame - 26, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "relative", width: 340, height: 340, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={340} height={340} style={{ position: "absolute", inset: 0, opacity: ringP, transform: `rotate(${rotate}deg)` }}>
          <circle cx={170} cy={170} r={150} stroke={COLORS.accentDim} strokeWidth={1.5} fill="none" strokeDasharray="4 10" />
        </svg>
        <svg width={280} height={280} style={{ position: "absolute", inset: 0, margin: "auto", opacity: ringP, transform: `rotate(${-rotate * 1.4}deg)` }}>
          <circle cx={140} cy={140} r={120} stroke={COLORS.accent} strokeWidth={1} fill="none" strokeDasharray="2 14" opacity={0.6} />
        </svg>
        <div
          style={{
            width: 170,
            height: 170,
            borderRadius: 28,
            border: `3px solid ${COLORS.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(circle, rgba(226,103,44,0.2), transparent 70%)`,
            opacity: logoP,
            transform: `scale(${logoP * pulse})`,
            boxShadow: `0 0 80px rgba(226,103,44,0.4)`,
          }}
        >
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 88, color: COLORS.accent }}>L</span>
        </div>
      </div>

      <div style={{ marginTop: 70, textAlign: "center", opacity: captionP, transform: `translateY(${(1 - captionP) * 16}px)`, padding: "0 90px" }}>
        <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 46, color: COLORS.paper, lineHeight: 1.25, margin: 0 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};
