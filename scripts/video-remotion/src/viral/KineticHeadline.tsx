import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_DISPLAY } from "../theme";

export type Word = { text: string; accent?: boolean };

export const KineticHeadline: React.FC<{
  lines: Word[][];
  startFrame?: number;
  fontSize?: number;
  align?: "center" | "left";
  style?: React.CSSProperties;
}> = ({ lines, startFrame = 0, fontSize = 58, align = "center", style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let globalIndex = 0;

  return (
    <div style={{ textAlign: align, ...style }}>
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: align === "center" ? "center" : "flex-start",
            gap: "0 0.32em",
          }}
        >
          {line.map((word, wi) => {
            const idx = globalIndex++;
            const p = spring({
              frame: frame - startFrame - idx * 3.2,
              fps,
              config: { damping: 16, stiffness: 160 },
            });
            const opacity = 0.14 + p * 0.86;
            const blur = (1 - p) * 6;
            const y = (1 - p) * 14;
            return (
              <span
                key={wi}
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 700,
                  fontSize,
                  lineHeight: 1.16,
                  color: word.accent ? COLORS.accent : COLORS.paper,
                  opacity,
                  filter: `blur(${blur}px)`,
                  transform: `translateY(${y}px)`,
                  display: "inline-block",
                }}
              >
                {word.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
