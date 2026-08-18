import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_DISPLAY } from "../../theme";

export const ChecklistScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 12, stiffness: 170 } });
  const checkP = spring({ frame: frame - 6, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: p, transform: `scale(${0.85 + p * 0.15})` }}>
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: 18,
            background: COLORS.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 20px 50px -16px rgba(226,103,44,0.5)",
          }}
        >
          <svg width={38} height={38} viewBox="0 0 24 24">
            <path
              d="M5 13l4 4 10-10"
              stroke={COLORS.ink}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={24}
              strokeDashoffset={24 * (1 - checkP)}
            />
          </svg>
        </div>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 52, color: COLORS.paper, lineHeight: 1.2 }}>{text}</span>
      </div>
    </div>
  );
};
