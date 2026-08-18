import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_BODY, FONT_MONO } from "../../theme";
import { KineticHeadline } from "../KineticHeadline";

const NOTIFS = [
  { title: "Appel manqué", body: "Client — Plombier Dupont" },
  { title: "Nouveau message", body: "« Vous êtes dispo demain ? »" },
  { title: "Avis Google ★", body: "« Jamais eu de réponse... »" },
];

const NotifChip: React.FC<{ item: (typeof NOTIFS)[number]; delay: number }> = ({ item, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 160 } });
  const vanish = spring({ frame: frame - delay - 34, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        background: COLORS.inkSoft,
        border: `1px solid ${COLORS.inkLine}`,
        borderRadius: 16,
        padding: "20px 26px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        opacity: p * (1 - vanish * 0.9),
        transform: `translateY(${(1 - p) * -30 + vanish * -20}px) scale(${1 - vanish * 0.06})`,
        boxShadow: "0 20px 50px -20px rgba(0,0,0,0.7)",
      }}
    >
      <span style={{ fontFamily: FONT_MONO, fontSize: 20, color: COLORS.accent }}>{item.title}</span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 24, color: COLORS.paper }}>{item.body}</span>
    </div>
  );
};

export const HookScene: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 70px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", alignItems: "center", marginBottom: 40 }}>
        {NOTIFS.map((n, i) => (
          <NotifChip key={i} item={n} delay={4 + i * 9} />
        ))}
      </div>
      <KineticHeadline
        startFrame={58}
        fontSize={56}
        lines={[
          [{ text: "Pendant" }, { text: "que" }, { text: "vous" }, { text: "travaillez," }],
          [{ text: "vos" }, { text: "clients," }, { text: "eux," }, { text: "attendent.", accent: true }],
        ]}
      />
    </div>
  );
};
