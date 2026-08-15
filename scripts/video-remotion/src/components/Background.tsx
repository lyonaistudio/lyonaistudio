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
          opacity: 0.5,
          transform: `translate(${driftX}px, ${driftY}px) scale(${scale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(700px 700px at ${glowX}% ${glowY}%, rgba(226,103,44,0.16), transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, opacity: 0.5, mixBlendMode: "overlay" }}
      >
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" opacity={0.06} />
      </svg>
    </div>
  );
};
