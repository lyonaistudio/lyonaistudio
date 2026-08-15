import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS, W, H } from "../theme";

export const Background: React.FC<{ totalDuration: number; fps: number }> = ({
  totalDuration,
  fps,
}) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  // Slow continuous parallax drift + gentle breathing scale, so the
  // background never reads as a static screenshot between fades.
  const driftX = interpolate(t, [0, totalDuration], [0, -60]);
  const driftY = interpolate(t, [0, totalDuration], [0, -40]);
  const scale = 1 + interpolate(t, [0, totalDuration], [0, 0.08]);

  const glowX = 50 + 18 * Math.sin(t / 9);
  const glowY = 32 + 10 * Math.cos(t / 11);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: COLORS.ink,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -80,
          backgroundImage: `linear-gradient(${COLORS.inkLine} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.inkLine} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          opacity: 0.4,
          filter: "blur(1.5px)",
          transform: `translate(${driftX}px, ${driftY}px) scale(${scale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(760px 760px at ${glowX}% ${glowY}%, rgba(226,103,44,0.20), transparent 65%)`,
          filter: "blur(2px)",
        }}
      />
      {/* Secondary cool-toned rim light, opposite corner, for a subtle
          two-tone (split-toning) cinematic grade rather than flat orange. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(900px 900px at ${100 - glowX}% ${100 - glowY}%, rgba(60,70,90,0.10), transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,0.68) 100%)",
        }}
      />
      {/* Subtle top/bottom letterbox shading for extra depth + focus on
          the vertical center band where the content lives. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.4) 100%)",
        }}
      />
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, opacity: 0.6, mixBlendMode: "overlay" }}
      >
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" opacity={0.085} />
      </svg>
    </div>
  );
};
