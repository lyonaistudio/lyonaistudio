import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_MONO } from "../theme";
import { Eyebrow } from "../components/Header";

export const Hook2Scene: React.FC<{ subtitle: string }> = ({ subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxP = spring({ frame, fps, config: { damping: 13, stiffness: 110 } });
  const dissolve = Math.min(1, Math.max(0, (frame - 30) / 40));
  const flicker = 1 - dissolve * (0.5 + 0.5 * Math.sin(frame / 3));

  const tagP = spring({ frame: frame - 34, fps, config: { damping: 200 } });
  const captionP = spring({ frame: frame - 58, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 90px" }}>
      <div style={{ width: "100%", marginBottom: 48 }}>
        <Eyebrow label="SANS SITE" appearFrame={4} style={{ textAlign: "center", width: "100%" }} />
      </div>

      <div
        style={{
          width: "100%",
          aspectRatio: "4 / 3",
          background: COLORS.inkSoft,
          border: `2px solid ${COLORS.inkLine}`,
          borderRadius: 20,
          opacity: boxP * (0.35 + 0.65 * flicker),
          transform: `scale(${0.88 + boxP * 0.12})`,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 30px 80px -30px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ height: 44, background: COLORS.ink, display: "flex", alignItems: "center", gap: 8, padding: "0 18px" }}>
          {[COLORS.accentDim, COLORS.mist, COLORS.inkLine].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, top: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 140,
              color: COLORS.mist,
              opacity: 0.45,
              transform: `translateX(${(1 - dissolve) * 0}px) scale(${1 + dissolve * 0.3})`,
              filter: `blur(${dissolve * 4}px)`,
            }}
          >
            ?
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: 44,
          fontFamily: FONT_MONO,
          fontSize: 30,
          letterSpacing: 2,
          color: COLORS.accent,
          opacity: tagP,
          transform: `translateY(${(1 - tagP) * 14}px)`,
        }}
      >
        INVISIBLE SUR GOOGLE
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
