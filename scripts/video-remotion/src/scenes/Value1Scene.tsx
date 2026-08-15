import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { staticFile } from "remotion";
import { COLORS, FONT_DISPLAY } from "../theme";
import { Eyebrow } from "../components/Header";

export const Value1Scene: React.FC<{ subtitle: string; durationInFrames: number }> = ({ subtitle, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxP = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const panY = interpolate(frame, [10, durationInFrames - 10], [0, -2200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const captionP = spring({ frame: frame - 6, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 60px" }}>
      <div style={{ width: "100%", marginTop: 210, marginBottom: 36 }}>
        <Eyebrow label="UN VRAI SITE, PAS UNE MAQUETTE" appearFrame={2} style={{ textAlign: "center", width: "100%" }} />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 960,
          opacity: boxP,
          transform: `scale(${0.9 + boxP * 0.1}) translateY(${(1 - boxP) * 30}px)`,
        }}
      >
        <div
          style={{
            border: `2px solid ${COLORS.inkLine}`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 40px 100px -30px rgba(0,0,0,0.75)",
            background: COLORS.ink,
          }}
        >
          <div style={{ height: 52, background: COLORS.inkSoft, display: "flex", alignItems: "center", gap: 20, padding: "0 22px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 13, height: 13, borderRadius: 7, background: "#a34a3c" }} />
              <div style={{ width: 13, height: 13, borderRadius: 7, background: "#b8934a" }} />
              <div style={{ width: 13, height: 13, borderRadius: 7, background: "#5c8a5c" }} />
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 20,
                color: COLORS.mist,
                background: COLORS.ink,
                padding: "6px 16px",
                borderRadius: 6,
              }}
            >
              Exemple de réalisation
            </div>
          </div>
          <div style={{ height: 780, overflow: "hidden", position: "relative" }}>
            <img
              src={staticFile("maona.jpg")}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${panY}px)`,
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 150,
          left: 80,
          right: 80,
          textAlign: "center",
          opacity: captionP,
        }}
      >
        <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 42, color: COLORS.paper, lineHeight: 1.25, margin: 0 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};
