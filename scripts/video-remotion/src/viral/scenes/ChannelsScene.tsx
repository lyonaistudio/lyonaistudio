import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_BODY } from "../../theme";
import { KineticHeadline } from "../KineticHeadline";
import { AvatarOrb } from "../AvatarOrb";

const CHANNELS = [
  { label: "Téléphone", icon: "phone" },
  { label: "Chat du site", icon: "chat" },
  { label: "SMS", icon: "sms" },
];

function ChanIcon({ type }: { type: string }) {
  const s = { stroke: COLORS.accent, strokeWidth: 2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "phone")
    return (
      <svg width={28} height={28} viewBox="0 0 24 24">
        <path {...s} d="M6 3h4l2 5-3 2c1 3 3 5 6 6l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2z" />
      </svg>
    );
  if (type === "chat")
    return (
      <svg width={28} height={28} viewBox="0 0 24 24">
        <path {...s} d="M4 4h16v13H9l-5 4V4z" />
      </svg>
    );
  return (
    <svg width={28} height={28} viewBox="0 0 24 24">
      <path {...s} d="M3 6h18v12H3V6z" />
      <path {...s} d="M3 6l9 7 9-7" />
    </svg>
  );
}

const ChanChip: React.FC<{ item: (typeof CHANNELS)[number]; delay: number }> = ({ item, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 150 } });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 26px",
        background: COLORS.inkSoft,
        border: `1px solid ${COLORS.inkLine}`,
        borderRadius: 14,
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px) scale(${0.92 + p * 0.08})`,
        boxShadow: "0 20px 40px -18px rgba(0,0,0,0.7)",
      }}
    >
      <ChanIcon type={item.icon} />
      <span style={{ fontFamily: FONT_BODY, fontSize: 26, color: COLORS.paper, fontWeight: 600 }}>{item.label}</span>
    </div>
  );
};

export const ChannelsScene: React.FC = () => {
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
        gap: 46,
      }}
    >
      <KineticHeadline
        startFrame={0}
        fontSize={54}
        lines={[
          [{ text: "Elle" }, { text: "est" }, { text: "là," }, { text: "partout,", accent: true }],
          [{ text: "en" }, { text: "même" }, { text: "temps." }],
        ]}
      />
      <AvatarOrb appearFrame={14} size={120} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 620 }}>
        {CHANNELS.map((c, i) => (
          <ChanChip key={c.label} item={c} delay={40 + i * 8} />
        ))}
      </div>
    </div>
  );
};
