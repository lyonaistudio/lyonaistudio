import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_MONO } from "../theme";

export const AvatarOrb: React.FC<{ appearFrame?: number; size?: number; label?: string }> = ({
  appearFrame = 0,
  size = 190,
  label,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearFrame, fps, config: { damping: 11, stiffness: 120 } });
  const pulse = 1 + 0.05 * Math.sin(Math.max(0, frame - appearFrame) / 9);
  const rotate = frame * 0.5;

  const bars = [0, 1, 2, 3, 4].map((i) => 10 + 18 * Math.abs(Math.sin((frame - appearFrame) / 6 + i * 1.3)));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ position: "absolute", inset: 0, opacity: p, transform: `rotate(${rotate}deg)` }}>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 6} stroke={COLORS.accentDim} strokeWidth={1.5} fill="none" strokeDasharray="3 9" />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 14,
            borderRadius: "50%",
            border: `3px solid ${COLORS.accent}`,
            background: "radial-gradient(circle, rgba(226,103,44,0.22), transparent 70%)",
            opacity: p,
            transform: `scale(${p * pulse})`,
            boxShadow: "0 0 70px rgba(226,103,44,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {bars.map((h, i) => (
            <div key={i} style={{ width: 6, height: h, borderRadius: 3, background: COLORS.accent }} />
          ))}
        </div>
      </div>
      {label && (
        <span style={{ fontFamily: FONT_MONO, fontSize: 24, letterSpacing: 2, color: COLORS.accent, opacity: p }}>
          {label}
        </span>
      )}
    </div>
  );
};
