import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY } from "../../theme";
import { KineticHeadline, Word } from "../KineticHeadline";

export const StatScene: React.FC<{ target: number; prefix?: string; unit: string; lines: Word[][] }> = ({
  target,
  prefix,
  unit,
  lines,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numP = spring({ frame, fps, config: { damping: 13, stiffness: 90 } });
  const displayed = Math.round(
    interpolate(frame, [4, 30], [0, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );
  const glowP = spring({ frame: frame - 6, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 80px", gap: 36 }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          opacity: numP,
          transform: `scale(${0.82 + numP * 0.18})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -40,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(226,103,44,${0.28 * glowP}), transparent 70%)`,
          }}
        />
        {prefix && (
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 64, color: COLORS.paper, position: "relative" }}>
            {prefix}
          </span>
        )}
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 168, lineHeight: 1, color: COLORS.accent, position: "relative" }}>
          {displayed}
        </span>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 46, color: COLORS.paper, position: "relative" }}>
          {unit}
        </span>
      </div>
      <KineticHeadline startFrame={26} fontSize={44} lines={lines} />
    </div>
  );
};
