import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONT_BODY } from "../../theme";
import { KineticHeadline } from "../KineticHeadline";

const DEVICES = [
  { label: "Mobile", type: "phone" },
  { label: "Tablette", type: "tablet" },
  { label: "Ordinateur", type: "desktop" },
];

function DeviceIcon({ type }: { type: string }) {
  const s = { stroke: COLORS.accent, strokeWidth: 2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "phone")
    return (
      <svg width={40} height={64} viewBox="0 0 30 48">
        <rect x="2" y="1" width="26" height="46" rx="5" {...s} />
        <line x1="12" y1="42" x2="18" y2="42" {...s} />
      </svg>
    );
  if (type === "tablet")
    return (
      <svg width={56} height={64} viewBox="0 0 42 48">
        <rect x="2" y="1" width="38" height="46" rx="5" {...s} />
        <line x1="18" y1="42" x2="24" y2="42" {...s} />
      </svg>
    );
  return (
    <svg width={72} height={64} viewBox="0 0 54 48">
      <rect x="1" y="1" width="52" height="34" rx="3" {...s} />
      <line x1="20" y1="44" x2="34" y2="44" {...s} />
      <line x1="27" y1="35" x2="27" y2="44" {...s} />
    </svg>
  );
}

const DeviceCard: React.FC<{ item: (typeof DEVICES)[number]; delay: number }> = ({ item, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 140 } });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "30px 26px",
        width: 200,
        background: COLORS.inkSoft,
        border: `1px solid ${COLORS.inkLine}`,
        borderRadius: 16,
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + p * 0.1})`,
        boxShadow: "0 20px 40px -18px rgba(0,0,0,0.7)",
      }}
    >
      <DeviceIcon type={item.type} />
      <span style={{ fontFamily: FONT_BODY, fontSize: 22, color: COLORS.paper, fontWeight: 600 }}>{item.label}</span>
    </div>
  );
};

export const DevicesScene: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 60px",
        gap: 54,
      }}
    >
      <KineticHeadline
        startFrame={0}
        fontSize={48}
        lines={[[{ text: "Parfait" }, { text: "sur" }, { text: "mobile," }], [{ text: "tablette" }, { text: "et" }, { text: "ordinateur.", accent: true }]]}
      />
      <div style={{ display: "flex", gap: 20 }}>
        {DEVICES.map((d, i) => (
          <DeviceCard key={d.label} item={d} delay={34 + i * 10} />
        ))}
      </div>
    </div>
  );
};
