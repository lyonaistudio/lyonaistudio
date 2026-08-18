import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_MONO, FONT_BODY } from "../theme";

const RailIcon: React.FC<{ type: "heart" | "comment" | "share" }> = ({ type }) => {
  const common = { stroke: COLORS.paper, strokeWidth: 2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={34} height={34} viewBox="0 0 24 24">
        {type === "heart" && (
          <path {...common} d="M12 20s-7-4.4-9.5-9C.8 7.6 2.6 4 6 4c2 0 3.4 1.1 4 2.2C10.6 5.1 12 4 14 4c3.4 0 5.2 3.6 3.5 7-2.5 4.6-9.5 9-9.5 9z" />
        )}
        {type === "comment" && <path {...common} d="M4 4h16v13H9l-5 4V4z" />}
        {type === "share" && (
          <>
            <path {...common} d="M4 12a8 8 0 0 1 13-6" />
            <path {...common} d="M17 3v4h-4" />
            <path {...common} d="M20 12a8 8 0 0 1-13 6" />
            <path {...common} d="M7 21v-4h4" />
          </>
        )}
      </svg>
    </div>
  );
};

export const SocialChrome: React.FC<{ appearFrame?: number }> = ({ appearFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearFrame, fps, config: { damping: 200 } });

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 44,
          left: 56,
          right: 56,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: p * 0.9,
        }}
      >
        <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 24, color: COLORS.paper }}>9:41</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: 5, height: 6 + i * 3, background: COLORS.paper, borderRadius: 1 }} />
          ))}
          <svg width={22} height={16} viewBox="0 0 24 16" style={{ marginLeft: 4 }}>
            <path d="M2 8a14 10 0 0 1 20 0" stroke={COLORS.paper} strokeWidth={2} fill="none" strokeLinecap="round" />
          </svg>
          <div style={{ width: 30, height: 15, border: `2px solid ${COLORS.paper}`, borderRadius: 3, marginLeft: 4, padding: 2, boxSizing: "border-box" }}>
            <div style={{ width: "70%", height: "100%", background: COLORS.paper, borderRadius: 1 }} />
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", right: 40, bottom: 340, display: "flex", flexDirection: "column", gap: 34, opacity: p * 0.85 }}>
        <RailIcon type="heart" />
        <RailIcon type="comment" />
        <RailIcon type="share" />
      </div>

      <div style={{ position: "absolute", left: 56, bottom: 260, display: "flex", alignItems: "center", gap: 12, opacity: p * 0.85 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1.5px solid ${COLORS.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_MONO,
            color: COLORS.accent,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          L
        </div>
        <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 22, color: COLORS.paper }}>lyonaistudio</span>
      </div>
    </>
  );
};
