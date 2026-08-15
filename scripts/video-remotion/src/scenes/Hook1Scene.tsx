import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { Eyebrow } from "../components/Header";

const QUERY = "plombier lyon";

export const Hook1Scene: React.FC<{ subtitle: string }> = ({ subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxP = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const typedChars = Math.round(interpolate(frame, [18, 48], [0, QUERY.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typed = QUERY.slice(0, typedChars);
  const cursorOn = Math.floor(frame / 10) % 2 === 0;

  const captionP = spring({ frame: frame - 60, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 90px" }}>
      <div style={{ width: "100%", marginBottom: 48 }}>
        <Eyebrow label="AUJOURD'HUI" appearFrame={4} style={{ textAlign: "center", width: "100%" }} />
      </div>

      <div
        style={{
          width: "100%",
          background: COLORS.inkSoft,
          border: `2px solid ${COLORS.inkLine}`,
          borderRadius: 100,
          padding: "38px 48px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          opacity: boxP,
          transform: `scale(${0.85 + boxP * 0.15})`,
          boxShadow: "0 30px 80px -30px rgba(0,0,0,0.7)",
        }}
      >
        <svg width={40} height={40} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" stroke={COLORS.accent} strokeWidth="2.4" fill="none" />
          <line x1="16.4" y1="16.4" x2="21" y2="21" stroke={COLORS.accent} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: FONT_BODY, fontSize: 44, color: COLORS.paper }}>
          {typed}
          <span style={{ opacity: cursorOn ? 1 : 0, color: COLORS.accent }}>|</span>
        </span>
      </div>

      <div style={{ marginTop: 40, width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
        {[0, 1, 2].map((i) => {
          const rp = spring({ frame: frame - 55 - i * 6, fps, config: { damping: 200 } });
          return (
            <div
              key={i}
              style={{
                height: 26,
                width: `${86 - i * 14}%`,
                background: COLORS.inkLine,
                borderRadius: 6,
                opacity: rp * 0.7,
                transform: `translateX(${(1 - rp) * -20}px)`,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 190,
          left: 80,
          right: 80,
          textAlign: "center",
          opacity: captionP,
          transform: `translateY(${(1 - captionP) * 16}px)`,
        }}
      >
        <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 46, color: COLORS.paper, lineHeight: 1.25, margin: 0 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};
