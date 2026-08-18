import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_DISPLAY } from "../../theme";

export const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoP = spring({ frame, fps, config: { damping: 9, stiffness: 100 } });
  const ringP = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const wordP = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  const rotate = frame * 0.7;
  const pulse = 1 + 0.05 * Math.sin(frame / 7);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={220} height={220} style={{ position: "absolute", inset: 0, opacity: ringP, transform: `rotate(${rotate}deg)` }}>
          <circle cx={110} cy={110} r={96} stroke={COLORS.accentDim} strokeWidth={1.5} fill="none" strokeDasharray="4 10" />
        </svg>
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: 26,
            border: `3px solid ${COLORS.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(circle, rgba(226,103,44,0.22), transparent 70%)",
            opacity: logoP,
            transform: `scale(${logoP * pulse})`,
            boxShadow: "0 0 80px rgba(226,103,44,0.4)",
          }}
        >
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 66, color: COLORS.accent }}>L</span>
        </div>
      </div>
      <span
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 46,
          color: COLORS.paper,
          opacity: wordP,
          transform: `translateY(${(1 - wordP) * 14}px)`,
        }}
      >
        Lyon AI Studio
      </span>
    </div>
  );
};
