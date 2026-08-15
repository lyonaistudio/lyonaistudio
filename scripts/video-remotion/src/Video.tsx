import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  useCurrentFrame,
  interpolate,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import timelineData from "./voice-timeline.json";
import { COLORS, FPS } from "./theme";
import { Background } from "./components/Background";
import { Header } from "./components/Header";
import { Hook1Scene } from "./scenes/Hook1Scene";
import { Hook2Scene } from "./scenes/Hook2Scene";
import { Value1Scene } from "./scenes/Value1Scene";
import { BridgeScene } from "./scenes/BridgeScene";
import { AI1Scene } from "./scenes/AI1Scene";
import { Recap1Scene } from "./scenes/Recap1Scene";
import { Recap2Scene } from "./scenes/Recap2Scene";
import { CTAScene } from "./scenes/CTAScene";

loadSpaceGrotesk();
loadInter();
loadJetBrainsMono();

type Beat = { id: string; text: string; start: number; duration: number };
const timeline = timelineData as Beat[];
const beat = Object.fromEntries(timeline.map((b) => [b.id, b]));

const OUTRO_HOLD = 3.6;
const END_FADE = 0.6;
const lastBeat = beat.cta;
export const TOTAL_DURATION_SEC = lastBeat.start + lastBeat.duration + OUTRO_HOLD + END_FADE;

const order = ["hook1", "hook2", "value1", "bridge", "ai1", "recap1", "recap2", "cta"];

const F = (sec: number) => Math.round(sec * FPS);

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
  const rise = interpolate(frame, [0, fadeInDur], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity, transform: `translateY(${rise}px)` }}>{children}</AbsoluteFill>
  );
};

export const MainVideo: React.FC = () => {
  const totalFrames = F(TOTAL_DURATION_SEC);
  const { fps } = useVideoConfig();

  const panels = order.map((id, i) => {
    const b = beat[id];
    const inFrame = Math.max(0, F(b.start) - F(0.35));
    const isLast = i === order.length - 1;
    const outFrame = isLast ? totalFrames : F(order[i + 1] === "cta" ? beat.cta.start : beat[order[i + 1]].start) - F(0.4);
    return { id, inFrame, outFrame: Math.max(outFrame, inFrame + 10), isLast };
  });

  const sceneFor = (id: string) => {
    const b = beat[id];
    switch (id) {
      case "hook1":
        return <Hook1Scene subtitle={b.text} />;
      case "hook2":
        return <Hook2Scene subtitle={b.text} />;
      case "value1":
        return <Value1Scene subtitle={b.text} durationInFrames={panels.find((p) => p.id === "value1")!.outFrame - panels.find((p) => p.id === "value1")!.inFrame} />;
      case "bridge":
        return <BridgeScene subtitle={b.text} />;
      case "ai1":
        return <AI1Scene subtitle={b.text} />;
      case "recap1":
        return <Recap1Scene />;
      case "recap2":
        return <Recap2Scene subtitle={b.text} />;
      case "cta":
        return <CTAScene />;
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Background totalDuration={TOTAL_DURATION_SEC} fps={fps} />
      <Header appearFrame={F(beat.hook1.start) + F(0.3)} />

      {panels.map((p) => (
        <Sequence key={p.id} from={p.inFrame} durationInFrames={p.outFrame - p.inFrame}>
          <Panel durationInFrames={p.outFrame - p.inFrame} isLast={p.isLast}>
            {sceneFor(p.id)}
          </Panel>
        </Sequence>
      ))}

      {/* End fade to black */}
      <Sequence from={totalFrames - F(END_FADE)} durationInFrames={F(END_FADE)}>
        <FadeToBlack durationInFrames={F(END_FADE)} />
      </Sequence>

      {/* Audio */}
      <Audio src={staticFile("narration.wav")} />
      <Audio src={staticFile("score.wav")} volume={0.5} />
      {panels.slice(0, -1).map((p) => (
        <Sequence key={"sfx-" + p.id} from={p.inFrame} durationInFrames={30}>
          <Audio src={staticFile("whoosh.wav")} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={panels[panels.length - 1].inFrame} durationInFrames={40}>
        <Audio src={staticFile("riser.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={F(beat.hook1.start) + F(0.3)} durationInFrames={20}>
        <Audio src={staticFile("tick.wav")} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};

const FadeToBlack: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, durationInFrames], [0, 1]);
  return <AbsoluteFill style={{ background: COLORS.ink, opacity }} />;
};
