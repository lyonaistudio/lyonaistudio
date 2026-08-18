import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate } from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { COLORS, FPS } from "./theme";
import { Background } from "./components/Background";
import { SocialChrome } from "./viral/SocialChrome";
import { ChecklistScene } from "./viral/scenes/ChecklistScene";
import { DevicesScene } from "./viral/scenes/DevicesScene";
import { LogoScene } from "./viral/scenes/LogoScene";
import { ViralCTAScene } from "./viral/scenes/ViralCTAScene";
import { Hook1Scene } from "./scenes/Hook1Scene";
import { Hook2Scene } from "./scenes/Hook2Scene";
import { Value1Scene } from "./scenes/Value1Scene";

loadSpaceGrotesk();
loadInter();
loadJetBrainsMono();

const F = (sec: number) => Math.round(sec * FPS);

const BEATS = [
  { id: "hook1", start: 0.0 },
  { id: "hook2", start: 5.5 },
  { id: "value1", start: 11.0 },
  { id: "devices", start: 20.0 },
  { id: "check1", start: 25.0 },
  { id: "check2", start: 28.0 },
  { id: "check3", start: 31.0 },
  { id: "logo", start: 34.0 },
  { id: "cta", start: 37.0 },
];
const CTA_DURATION = 6.5;
const END_FADE = 0.6;
export const TOTAL_DURATION_SEC = BEATS[BEATS.length - 1].start + CTA_DURATION + END_FADE;

const Panel: React.FC<{ durationInFrames: number; children: React.ReactNode; isLast?: boolean }> = ({
  durationInFrames,
  children,
  isLast,
}) => {
  const frame = useCurrentFrame();
  const fadeInDur = 14;
  const fadeOutDur = 12;
  const opacity = isLast
    ? interpolate(frame, [0, fadeInDur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(
        frame,
        [0, fadeInDur, durationInFrames - fadeOutDur, durationInFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
  const rise = interpolate(frame, [0, fadeInDur], [36, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity, transform: `translateY(${rise}px)` }}>{children}</AbsoluteFill>;
};

export const SitesVideo: React.FC = () => {
  const totalFrames = F(TOTAL_DURATION_SEC);

  const panels = BEATS.map((b, i) => {
    const isLast = i === BEATS.length - 1;
    const inFrame = i === 0 ? 0 : Math.max(0, F(b.start) - F(0.35));
    const outFrame = isLast ? totalFrames : F(BEATS[i + 1].start) - F(0.4);
    return { id: b.id, inFrame, outFrame: Math.max(outFrame, inFrame + 10), isLast };
  });

  const value1Panel = panels.find((p) => p.id === "value1")!;

  const sceneFor = (id: string) => {
    switch (id) {
      case "hook1":
        return (
          <Hook1Scene
            subtitle="Aujourd'hui, vos clients vous cherchent sur Google avant de vous appeler."
            captionBottom={320}
          />
        );
      case "hook2":
        return (
          <Hook2Scene
            subtitle="Sans site internet, vous restez invisible — même avec un excellent travail."
            captionBottom={320}
          />
        );
      case "value1":
        return (
          <Value1Scene
            subtitle="Un site qui inspire confiance dès la première visite : rapide, clair, pensé pour convertir."
            durationInFrames={value1Panel.outFrame - value1Panel.inFrame}
            captionBottom={320}
          />
        );
      case "devices":
        return <DevicesScene />;
      case "check1":
        return <ChecklistScene text="Optimisé pour Google (SEO)" />;
      case "check2":
        return <ChecklistScene text="Prêt en quelques semaines" />;
      case "check3":
        return <ChecklistScene text="Design sur-mesure, pas un template" />;
      case "logo":
        return <LogoScene />;
      case "cta":
        return (
          <ViralCTAScene
            headline={[[{ text: "Discutons" }, { text: "de" }, { text: "votre" }, { text: "site.", accent: true }]]}
            tagline="Un premier échange, sans engagement — présentation sous quelques jours."
          />
        );
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ background: COLORS.ink, filter: "contrast(1.12) saturate(1.14) brightness(0.97)" }}>
      <Background totalDuration={TOTAL_DURATION_SEC} fps={FPS} />
      <SocialChrome appearFrame={2} />

      {panels.map((p) => (
        <Sequence key={p.id} from={p.inFrame} durationInFrames={p.outFrame - p.inFrame}>
          <Panel durationInFrames={p.outFrame - p.inFrame} isLast={p.isLast}>
            {sceneFor(p.id)}
          </Panel>
        </Sequence>
      ))}

      <Sequence from={totalFrames - F(END_FADE)} durationInFrames={F(END_FADE)}>
        <FadeToBlack durationInFrames={F(END_FADE)} />
      </Sequence>

      <Audio src={staticFile("sites-score.wav")} volume={0.85} />

      {(() => {
        const whooshAt = new Set(["value1", "devices", "cta"]);
        return panels.slice(0, -1).map((p, i) => {
          const nextId = panels[i + 1].id;
          const useWhoosh = whooshAt.has(nextId);
          return (
            <Sequence key={"sfx-" + p.id} from={p.outFrame - F(0.05)} durationInFrames={30}>
              <Audio src={staticFile(useWhoosh ? "whoosh.wav" : "tick.wav")} volume={useWhoosh ? 0.34 : 0.22} />
            </Sequence>
          );
        });
      })()}

      <Sequence from={panels[panels.length - 1].inFrame} durationInFrames={40}>
        <Audio src={staticFile("riser.wav")} volume={0.4} />
      </Sequence>

      <Sequence from={F(BEATS.find((b) => b.id === "cta")!.start) + F(1.3)} durationInFrames={30}>
        <Audio src={staticFile("ding.wav")} volume={0.32} />
      </Sequence>
    </AbsoluteFill>
  );
};

const FadeToBlack: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, durationInFrames], [0, 1]);
  return <AbsoluteFill style={{ background: COLORS.ink, opacity }} />;
};
