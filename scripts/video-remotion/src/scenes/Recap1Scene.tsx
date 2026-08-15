import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_DISPLAY } from "../theme";

const LINES = ["Un site qui vous", "représente.", "Des outils qui travaillent", "à votre place."];

export const Recap1Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 90px" }}>
      {LINES.map((line, i) => {
        const delay = i * 10;
        const p = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 130 } });
        const fromLeft = i % 2 === 0;
        return (
          <div key={i} style={{ overflow: "hidden", padding: "10px 0" }}>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 700,
                fontSize: 66,
                color: i === 1 || i === 3 ? COLORS.accent : COLORS.paper,
                textAlign: "center",
                opacity: p,
                transform: `translateX(${(1 - p) * (fromLeft ? -80 : 80)}px)`,
              }}
            >
              {line}
            </div>
          </div>
        );
      })}
    </div>
  );
};
