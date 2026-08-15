import React from "react";
import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { COLORS, FONT_MONO, FONT_BODY } from "../theme";

const LEFT = [
  { label: "Message client", icon: "chat" },
  { label: "Email", icon: "mail" },
  { label: "Demande de RDV", icon: "calendar" },
];
const RIGHT = [
  { label: "Réponse envoyée", icon: "check" },
  { label: "RDV programmé", icon: "calendar" },
  { label: "Client relancé", icon: "bell" },
];

function Icon({ type, color }: { type: string; color: string }) {
  const s = { stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "chat":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <path {...s} d="M4 4h16v12H8l-4 4V4z" />
        </svg>
      );
    case "mail":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <path {...s} d="M3 6h18v12H3V6z" />
          <path {...s} d="M3 6l9 7 9-7" />
        </svg>
      );
    case "calendar":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <path {...s} d="M4 5h16v15H4V5z" />
          <path {...s} d="M4 9h16M8 3v4M16 3v4" />
        </svg>
      );
    case "check":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <circle {...s} cx="12" cy="12" r="9" />
          <path {...s} d="M8 12l3 3 5-6" />
        </svg>
      );
    case "bell":
      return (
        <svg width="28" height="28" viewBox="0 0 24 24">
          <path {...s} d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" />
          <path {...s} d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    default:
      return null;
  }
}

const Node: React.FC<{ item: { label: string; icon: string }; delay: number; fromRight: boolean }> = ({
  item,
  delay,
  fromRight,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120, mass: 0.6 } });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 26px",
        background: COLORS.inkSoft,
        border: `1px solid ${COLORS.inkLine}`,
        borderRadius: 12,
        opacity: p,
        transform: `translateX(${(1 - p) * (fromRight ? 60 : -60)}px) scale(${0.9 + p * 0.1})`,
        boxShadow: "0 12px 30px -14px rgba(0,0,0,0.6)",
      }}
    >
      {!fromRight && <Icon type={item.icon} color={COLORS.accent} />}
      <span style={{ fontFamily: FONT_BODY, fontSize: 24, color: COLORS.paper, fontWeight: 600 }}>
        {item.label}
      </span>
      {fromRight && <Icon type={item.icon} color={COLORS.accentSoft} />}
    </div>
  );
};

export const WorkflowDiagram: React.FC<{ appearFrame: number }> = ({ appearFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const centerP = spring({ frame: frame - appearFrame, fps, config: { damping: 12, stiffness: 140 } });
  const pulse = 1 + 0.06 * Math.sin((frame - appearFrame) / 8);

  const flowOffset = interpolate((frame - appearFrame) % 60, [0, 60], [0, -60]);

  const rows = [0, 1, 2];
  const rowY = [0, 130, 260];

  return (
    <div style={{ position: "relative", width: 900, height: 420 }}>
      <svg width={900} height={420} style={{ position: "absolute", inset: 0 }}>
        {rows.map((i) => (
          <React.Fragment key={i}>
            <path
              d={`M 230 ${60 + rowY[i]} Q 400 210 450 210`}
              stroke={COLORS.accent}
              strokeWidth={2}
              strokeDasharray="10 8"
              strokeDashoffset={flowOffset}
              fill="none"
              opacity={spring({ frame: frame - appearFrame - i * 4, fps, config: { damping: 200 } })}
            />
            <path
              d={`M 450 210 Q 500 210 670 ${60 + rowY[i]}`}
              stroke={COLORS.accentSoft}
              strokeWidth={2}
              strokeDasharray="10 8"
              strokeDashoffset={flowOffset}
              fill="none"
              opacity={spring({ frame: frame - appearFrame - i * 4, fps, config: { damping: 200 } })}
            />
          </React.Fragment>
        ))}
      </svg>

      <div style={{ position: "absolute", left: 0, top: 30, display: "flex", flexDirection: "column", gap: 40 }}>
        {LEFT.map((item, i) => (
          <Node key={item.label} item={item} delay={appearFrame + i * 6} fromRight={false} />
        ))}
      </div>
      <div style={{ position: "absolute", right: 0, top: 30, display: "flex", flexDirection: "column", gap: 40 }}>
        {RIGHT.map((item, i) => (
          <Node key={item.label} item={item} delay={appearFrame + 6 + i * 6} fromRight />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 450,
          top: 210,
          width: 130,
          height: 130,
          marginLeft: -65,
          marginTop: -65,
          borderRadius: "50%",
          border: `2px solid ${COLORS.accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle, rgba(226,103,44,0.18), transparent 70%)`,
          opacity: centerP,
          transform: `scale(${centerP * pulse})`,
          boxShadow: `0 0 60px rgba(226,103,44,0.35)`,
        }}
      >
        <span style={{ fontFamily: FONT_MONO, color: COLORS.accent, fontSize: 22, textAlign: "center", lineHeight: 1.3 }}>
          AGENT
          <br />
          IA
        </span>
      </div>
    </div>
  );
};
