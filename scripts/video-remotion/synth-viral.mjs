// Bande-son procédurale pour la vidéo "virale" (100% synthétisée par code,
// aucun sample ni piste existante — aucun risque de droits). Tempo plus
// rapide et énergie qui "drop" dès la révélation de l'agent IA, pensé pour
// un format court/muet façon TikTok-Reels (pas de voix off à ménager).
import { writeFileSync } from "node:fs";

const SR = 44100;
const DURATION = 43.6;
const TEMPO = 128;
const BEAT = 60 / TEMPO;

function empty(sec) {
  return new Float32Array(Math.max(1, Math.round(sec * SR)));
}

function mix(dest, src, offsetSec, gain = 1) {
  const offset = Math.round(offsetSec * SR);
  for (let i = 0; i < src.length; i++) {
    const idx = offset + i;
    if (idx >= 0 && idx < dest.length) dest[idx] += src[i] * gain;
  }
}

function osc(type, freq, dur) {
  const n = Math.round(dur * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const phase = freq * t;
    let v;
    if (type === "sine") v = Math.sin(2 * Math.PI * phase);
    else if (type === "triangle") v = 2 * Math.abs(2 * ((phase + 0.25) % 1) - 1) - 1;
    else if (type === "saw") v = 2 * (phase % 1) - 1;
    else v = Math.random() * 2 - 1;
    buf[i] = v;
  }
  return buf;
}

function envelope(buf, attack, decay, sustain, release) {
  const n = buf.length;
  const a = Math.max(1, Math.round(attack * SR));
  const d = Math.max(1, Math.round(decay * SR));
  const r = Math.max(1, Math.round(release * SR));
  for (let i = 0; i < n; i++) {
    let env;
    if (i < a) env = i / a;
    else if (i < a + d) env = 1 - (1 - sustain) * ((i - a) / d);
    else if (i < n - r) env = sustain;
    else env = sustain * Math.max(0, (n - i) / r);
    buf[i] *= env;
  }
  return buf;
}

function lowpassish(buf, amount) {
  let prev = 0;
  const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    prev = prev + amount * (buf[i] - prev);
    out[i] = prev;
  }
  return out;
}

const NOTE_SEMITONES = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function note(name) {
  const m = name.match(/^([A-G])(b)?(\d)$/);
  const [, letter, flat, octave] = m;
  let semi = NOTE_SEMITONES[letter] + (flat ? -1 : 0);
  semi += (Number(octave) - 4) * 12;
  return 440 * Math.pow(2, semi / 12);
}

// Progression F - C - Dm - Bb, cohérente avec le score du spot narré.
const PROGRESSION = [
  { bass: "F2", chord: ["F3", "A3", "C4"], arp: ["F4", "A4", "C5", "A4"] },
  { bass: "C2", chord: ["C3", "E3", "G3"], arp: ["C4", "E4", "G4", "E4"] },
  { bass: "D2", chord: ["D3", "F3", "A3"], arp: ["D4", "F4", "A4", "F4"] },
  { bass: "Bb1", chord: ["Bb2", "D3", "F3"], arp: ["Bb3", "D4", "F4", "D4"] },
];
const BARS_PER_CHORD = 2;
const BEATS_PER_CHORD = BARS_PER_CHORD * 4;
const CHORD_DUR = BEATS_PER_CHORD * BEAT;

// Énergie par section, calée sur ViralVideo.tsx (BEATS) : hook sparse,
// "drop" complet dès la révélation de l'agent, léger retrait aux checklists
// pour que le "tick" de chaque coche s'entende, respiration au logo, pic au CTA.
function energyAt(t) {
  if (t < 5.5) return 0.15; // hook: sparse, notifications
  if (t < 11.5) return 0.5; // persona reveal: building
  if (t < 20.0) return 1.0; // workflow: full groove, the detailed section
  if (t < 24.5) return 0.85; // stat callout
  if (t < 33.5) return 0.72; // three checklist beats
  if (t < 36.5) return 0.5; // logo: breathe
  return 1.0; // CTA: peak
}

const master = empty(DURATION + 1);

// Pad
let t = 0;
let chordIndex = 0;
while (t < DURATION) {
  const { chord } = PROGRESSION[chordIndex % PROGRESSION.length];
  const dur = Math.min(CHORD_DUR, DURATION - t + 1);
  const localEnergy = energyAt(t + dur / 2);
  const gain = 0.05 + localEnergy * 0.05;
  chord.forEach((n, i) => {
    const freq = note(n);
    const pad = envelope(osc("triangle", freq, dur), 0.5, 0.25, 0.85, 0.5);
    mix(master, pad, t, gain * (i === 1 ? 0.85 : 1));
  });
  t += CHORD_DUR;
  chordIndex++;
}

// Basse
t = 0;
chordIndex = 0;
while (t < DURATION) {
  const { bass } = PROGRESSION[chordIndex % PROGRESSION.length];
  const freq = note(bass);
  for (let b = 0; b < BEATS_PER_CHORD; b++) {
    const noteT = t + b * BEAT;
    if (noteT >= DURATION) break;
    const localEnergy = energyAt(noteT);
    if (localEnergy < 0.3) continue;
    const dur = BEAT * 0.9;
    const bassNote = envelope(osc("sine", freq, dur), 0.01, 0.12, 0.6, 0.12);
    mix(master, bassNote, noteT, 0.17 * (0.4 + localEnergy * 0.6));
  }
  t += CHORD_DUR;
  chordIndex++;
}

// Arpège
const SIXTEENTH = BEAT / 4;
t = 0;
chordIndex = 0;
while (t < DURATION) {
  const { arp } = PROGRESSION[chordIndex % PROGRESSION.length];
  const stepsInChord = BEATS_PER_CHORD * 4;
  for (let s = 0; s < stepsInChord; s++) {
    const noteT = t + s * SIXTEENTH;
    if (noteT >= DURATION) break;
    const localEnergy = energyAt(noteT);
    if (localEnergy < 0.45) continue;
    const freq = note(arp[s % arp.length]);
    const dur = SIXTEENTH * 0.8;
    const pluck = envelope(osc("saw", freq, dur), 0.003, 0.07, 0.0, 0.05);
    mix(master, pluck, noteT, 0.055 * localEnergy);
  }
  t += CHORD_DUR;
  chordIndex++;
}

// Batterie
function kick(dur = 0.2) {
  const n = Math.round(dur * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const freq = 155 * Math.exp(-tt * 30) + 44;
    buf[i] = Math.sin(2 * Math.PI * freq * tt);
  }
  return envelope(buf, 0.001, 0.07, 0.0, 0.1);
}
function hihat(dur = 0.04) {
  const buf = lowpassish(osc("noise", 0, dur), 0.9);
  return envelope(buf, 0.001, 0.018, 0.0, 0.018);
}
function clap(dur = 0.11) {
  const buf = lowpassish(osc("noise", 0, dur), 0.6);
  return envelope(buf, 0.001, 0.045, 0.0, 0.065);
}

t = 0;
while (t < DURATION) {
  const localEnergy = energyAt(t);
  const beatInBar = Math.round(t / BEAT) % 4;

  if (localEnergy >= 0.75) {
    mix(master, kick(), t, 0.52);
  } else if (localEnergy >= 0.45 && beatInBar % 2 === 0) {
    mix(master, kick(), t, 0.4);
  }

  if (localEnergy >= 0.75 && beatInBar === 2) {
    mix(master, clap(), t, 0.24);
  }

  if (localEnergy >= 0.65) {
    for (let e = 0; e < 2; e++) {
      const hhT = t + e * (BEAT / 2);
      if (hhT < DURATION) mix(master, hihat(), hhT, 0.1);
    }
  }

  t += BEAT;
}

// Mastering
function softClip(x) {
  return Math.tanh(x * 1.18);
}
const fadeInSamples = Math.round(0.25 * SR);
const fadeOutStart = Math.round((DURATION - 0.5) * SR);
const fadeOutSamples = Math.round(0.5 * SR);

for (let i = 0; i < master.length; i++) {
  let v = softClip(master[i]);
  if (i < fadeInSamples) v *= i / fadeInSamples;
  if (i > fadeOutStart) v *= Math.max(0, (fadeOutStart + fadeOutSamples - i) / fadeOutSamples);
  master[i] = v;
}

const totalSamples = Math.round(DURATION * SR);
const trimmed = master.slice(0, totalSamples);

function writeWav(path, mono) {
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = mono.length * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < mono.length; i++) {
    const sample = Math.max(-1, Math.min(1, mono[i]));
    const int16 = Math.round(sample * 32767);
    buffer.writeInt16LE(int16, offset);
    buffer.writeInt16LE(int16, offset + 2);
    offset += 4;
  }

  writeFileSync(path, buffer);
}

writeWav("public/viral-score.wav", trimmed);
console.log("viral-score.wav written:", (trimmed.length / SR).toFixed(2), "s");
