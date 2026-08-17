import React from "react";
import { useCurrentFrame, useVideoConfig, spring, staticFile, interpolate } from "remotion";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";

const Particle: React.FC<{ seed: number }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const x = 15 + ((seed * 37) % 70);
  const speed = 0.4 + (seed % 5) * 0.15;
  const y = 100 - ((frame * speed + seed * 20) % 110);
  const opacity = interpolate(y, [0, 15, 85, 100], [0, 0.7, 0.7, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: 5,
        height: 5,
        borderRadius: 3,
        background: COLORS.accent,
        opacity,
      }}
    />
  );
};

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandP = spring({ frame, fps, config: { damping: 13, stiffness: 120 } });
  const tagP = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const contactP = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const btnP = spring({ frame: frame - 32, fps, config: { damping: 11, stiffness: 140 } });
  const qrP = spring({ frame: frame - 44, fps, config: { damping: 200 } });
  const btnPulse = 1 + 0.03 * Math.sin(Math.max(0, frame - 60) / 10);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <Particle key={i} seed={i} />
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: brandP, transform: `translateY(${(1 - brandP) * 20}px)` }}>
        <div
          style={{
            width: 68,
            height: 68,
            border: `2px solid ${COLORS.accent}`,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 34, color: COLORS.accent }}>L</span>
        </div>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 58, color: COLORS.paper }}>Lyon AI Studio</span>
      </div>

      <p style={{ fontFamily: FONT_BODY, fontSize: 32, color: COLORS.paperDim, marginTop: 20, opacity: tagP }}>
        Sites internet &amp; automatisation IA
      </p>

      <div style={{ marginTop: 34, textAlign: "center", opacity: contactP, fontFamily: FONT_MONO, fontSize: 26 }}>
        <div>
          <span style={{ color: COLORS.accent }}>T. </span>
          <span style={{ color: COLORS.paper }}>07 76 62 42 15</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{ color: COLORS.accent }}>E. </span>
          <span style={{ color: COLORS.paper }}>lyonaistudio@gmail.com</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 46,
          padding: "24px 56px",
          background: COLORS.accent,
          borderRadius: 12,
          opacity: btnP,
          transform: `scale(${btnP * btnPulse})`,
          boxShadow: "0 20px 50px -16px rgba(226,103,44,0.5)",
        }}
      >
        <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 32, color: COLORS.ink }}>
          Demande de renseignements
        </span>
      </div>

      <div style={{ marginTop: 44, opacity: qrP, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <img src={staticFile("qr.png")} style={{ width: 210, height: 210 }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 22, color: COLORS.mist }}>lyonaistudio.fr</span>
      </div>
    </div>
  );
};
