// Bande-son procédurale pour la vidéo "Sites internet" (100% synthétisée,
// aucun sample). Tempo plus lent, énergie plafonnée plus bas et batterie
// plus rare que le score "Agents" : ambiance premium/confiante plutôt que
// punchy, pour laisser respirer le mockup du site.
import { writeFileSync } from "node:fs";

const SR = 44100;
const DURATION = 26.4;
const TEMPO = 100;
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

// Même progression que les autres scores, pour une identité sonore cohérente
// entre les trois vidéos de la campagne.
const PROGRESSION = [
  { bass: "F2", chord: ["F3", "A3", "C4"], arp: ["F4", "A4", "C5", "A4"] },
  { bass: "C2", chord: ["C3", "E3", "G3"], arp: ["C4", "E4", "G4", "E4"] },
  { bass: "D2", chord: ["D3", "F3", "A3"], arp: ["D4", "F4", "A4", "F4"] },
  { bass: "Bb1", chord: ["Bb2", "D3", "F3"], arp: ["Bb3", "D4", "F4", "D4"] },
];
const BARS_PER_CHORD = 2;
const BEATS_PER_CHORD = BARS_PER_CHORD * 4;
const CHORD_DUR = BEATS_PER_CHORD * BEAT;

// Énergie plafonnée à 0.85 (jamais le "plein groove" du score Agents) et
// section value1 volontairement calme pour laisser le mockup du site parler.
function energyAt(t) {
  if (t < 4.0) return 0.12;
  if (t < 8.0) return 0.3;
  if (t < 14.5) return 0.5;
  if (t < 18.5) return 0.4;
  if (t < 20.8) return 0.3;
  return 0.85;
}

const master = empty(DURATION + 1);

// Pad
let t = 0;
let chordIndex = 0;
while (t < DURATION) {
  const { chord } = PROGRESSION[chordIndex % PROGRESSION.length];
  const dur = Math.min(CHORD_DUR, DURATION - t + 1);
  const localEnergy = energyAt(t + dur / 2);
  const gain = 0.055 + localEnergy * 0.055;
  chord.forEach((n, i) => {
    const freq = note(n);
    const pad = envelope(osc("triangle", freq, dur), 0.7, 0.35, 0.85, 0.7);
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
    if (localEnergy < 0.25 || b % 2 !== 0) continue; // half-time, plus feutré
    const dur = BEAT * 1.1;
    const bassNote = envelope(osc("sine", freq, dur), 0.02, 0.2, 0.55, 0.25);
    mix(master, bassNote, noteT, 0.15 * (0.4 + localEnergy * 0.6));
  }
  t += CHORD_DUR;
  chordIndex++;
}

// Arpège (plus épars, laisse de l'air)
const SIXTEENTH = BEAT / 4;
t = 0;
chordIndex = 0;
while (t < DURATION) {
  const { arp } = PROGRESSION[chordIndex % PROGRESSION.length];
  const stepsInChord = BEATS_PER_CHORD * 4;
  for (let s = 0; s < stepsInChord; s++) {
    if (s % 2 !== 0) continue; // croches, pas doubles-croches : plus posé
    const noteT = t + s * SIXTEENTH;
    if (noteT >= DURATION) break;
    const localEnergy = energyAt(noteT);
    if (localEnergy < 0.35) continue;
    const freq = note(arp[(s / 2) % arp.length]);
    const dur = SIXTEENTH * 1.6;
    const pluck = envelope(osc("triangle", freq, dur), 0.01, 0.2, 0.1, 0.2);
    mix(master, pluck, noteT, 0.05 * localEnergy);
  }
  t += CHORD_DUR;
  chordIndex++;
}

// Batterie très sobre : pas de kick avant la section CTA, juste un hi-hat
// discret pour donner du mouvement pendant value1/checklists.
function kick(dur = 0.22) {
  const n = Math.round(dur * SR);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    const freq = 140 * Math.exp(-tt * 26) + 42;
    buf[i] = Math.sin(2 * Math.PI * freq * tt);
  }
  return envelope(buf, 0.002, 0.09, 0.0, 0.14);
}
function hihat(dur = 0.035) {
  const buf = lowpassish(osc("noise", 0, dur), 0.92);
  return envelope(buf, 0.001, 0.015, 0.0, 0.015);
}

t = 0;
while (t < DURATION) {
  const localEnergy = energyAt(t);
  const beatInBar = Math.round(t / BEAT) % 4;

  if (localEnergy >= 0.8 && beatInBar % 2 === 0) {
    mix(master, kick(), t, 0.42);
  }
  if (localEnergy >= 0.45) {
    for (let e = 0; e < 2; e++) {
      const hhT = t + e * (BEAT / 2);
      if (hhT < DURATION) mix(master, hihat(), hhT, 0.06);
    }
  }

  t += BEAT;
}

// Mastering
function softClip(x) {
  return Math.tanh(x * 1.1);
}
const fadeInSamples = Math.round(0.4 * SR);
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

writeWav("public/sites-score.wav", trimmed);
console.log("sites-score.wav written:", (trimmed.length / SR).toFixed(2), "s");
