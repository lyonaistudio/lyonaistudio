import React from "react";
import { useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../theme";

export const Header: React.FC<{ appearFrame: number }> = ({ appearFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearFrame, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: 64,
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: p,
        transform: `translateY(${(1 - p) * -12}px)`,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          border: `2px solid ${COLORS.accent}`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.accent,
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 24,
        }}
      >
        L
      </div>
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 28, color: COLORS.paper }}>
        Lyon AI Studio
      </span>
    </div>
  );
};

export const Eyebrow: React.FC<{ label: string; appearFrame: number; style?: React.CSSProperties }> = ({
  label,
  appearFrame,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearFrame, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 26,
        letterSpacing: 3,
        color: COLORS.accent,
        opacity: p,
        transform: `translateX(${(1 - p) * -24}px)`,
        ...style,
      }}
    >
      {"// " + label}
    </div>
  );
};
