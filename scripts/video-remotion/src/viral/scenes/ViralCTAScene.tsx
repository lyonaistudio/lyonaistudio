import React from "react";
import { useCurrentFrame, useVideoConfig, spring, staticFile } from "remotion";
import { COLORS, FONT_BODY, FONT_MONO } from "../../theme";
import { KineticHeadline, Word } from "../KineticHeadline";

export const ViralCTAScene: React.FC<{ headline?: Word[][]; tagline?: string }> = ({
  headline = [[{ text: "Réservez" }, { text: "votre" }, { text: "démo.", accent: true }]],
  tagline = "Gagnez du temps dès cette semaine.",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const contactP = spring({ frame: frame - 28, fps, config: { damping: 200 } });
  const btnP = spring({ frame: frame - 40, fps, config: { damping: 11, stiffness: 140 } });
  const qrP = spring({ frame: frame - 52, fps, config: { damping: 200 } });
  const btnPulse = 1 + 0.03 * Math.sin(Math.max(0, frame - 70) / 10);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        padding: "0 70px",
      }}
    >
      <KineticHeadline startFrame={0} fontSize={54} lines={headline} />
      <p style={{ fontFamily: FONT_BODY, fontSize: 28, color: COLORS.paperDim, margin: 0, opacity: contactP, textAlign: "center" }}>
        {tagline}
      </p>
      <div style={{ textAlign: "center", opacity: contactP, fontFamily: FONT_MONO, fontSize: 24, marginTop: 4 }}>
        <div>
          <span style={{ color: COLORS.accent }}>E. </span>
          <span style={{ color: COLORS.paper }}>lyonaistudio@gmail.com</span>
        </div>
      </div>
      <div
        style={{
          marginTop: 10,
          padding: "22px 48px",
          background: COLORS.accent,
          borderRadius: 12,
          opacity: btnP,
          transform: `scale(${btnP * btnPulse})`,
          boxShadow: "0 20px 50px -16px rgba(226,103,44,0.5)",
        }}
      >
        <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 30, color: COLORS.ink }}>Demander ma démo gratuite</span>
      </div>
      <div style={{ marginTop: 20, opacity: qrP, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <img src={staticFile("qr.png")} style={{ width: 170, height: 170 }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.mist }}>lyonaistudio.fr</span>
      </div>
    </div>
  );
};
