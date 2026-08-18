import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_BODY, FONT_MONO } from "../../theme";
import { KineticHeadline } from "../KineticHeadline";
import { AvatarOrb } from "../AvatarOrb";

const Bubble: React.FC<{ text: string; from: "client" | "agent"; delay: number }> = ({ text, from, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 150 } });
  const isAgent = from === "agent";
  return (
    <div
      style={{
        alignSelf: isAgent ? "flex-end" : "flex-start",
        maxWidth: "78%",
        background: isAgent ? COLORS.accent : COLORS.inkSoft,
        border: isAgent ? "none" : `1px solid ${COLORS.inkLine}`,
        borderRadius: 18,
        borderBottomRightRadius: isAgent ? 4 : 18,
        borderBottomLeftRadius: isAgent ? 18 : 4,
        padding: "14px 20px",
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px) scale(${0.92 + p * 0.08})`,
      }}
    >
      <span style={{ fontFamily: FONT_BODY, fontSize: 24, color: isAgent ? COLORS.ink : COLORS.paper, fontWeight: isAgent ? 600 : 400 }}>
        {text}
      </span>
    </div>
  );
};

export const PersonaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tsP = spring({ frame: frame - 84, fps, config: { damping: 200 } });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
        gap: 40,
      }}
    >
      <KineticHeadline
        startFrame={0}
        fontSize={54}
        lines={[
          [{ text: "Votre" }, { text: "agent", accent: true }, { text: "IA", accent: true }],
          [{ text: "répond" }, { text: "à" }, { text: "votre" }, { text: "place." }],
        ]}
      />
      <AvatarOrb appearFrame={22} size={150} label="AGENT IA" />
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 14 }}>
        <Bubble text="Vous êtes dispo demain matin ?" from="client" delay={56} />
        <Bubble text="Oui, 9h ou 10h30 !" from="agent" delay={68} />
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.accent, opacity: tsP, marginTop: -14 }}>
        Répondu en 8 secondes
      </span>
    </div>
  );
};
