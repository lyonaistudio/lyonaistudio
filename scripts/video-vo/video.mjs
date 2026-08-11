import { animate } from "motion";
import timelineData from "./voice-timeline.json" with { type: "json" };

const controls = [];
const OVERSHOOT = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const beat = Object.fromEntries(timelineData.map((b) => [b.id, b]));

function el(sel) { return document.querySelector(sel); }
function els(sel) { return Array.from(document.querySelectorAll(sel)); }

function fadeIn(target, { at, dur = 0.5, y = 0, x = 0, scale, ease = "ease-out" }) {
  const opacity = [0, 1];
  const transform = {};
  if (y) transform.y = [y, 0];
  if (x) transform.x = [x, 0];
  if (scale) transform.scale = [scale, 1];
  controls.push(animate(target, { opacity, ...transform }, { delay: at, duration: dur, ease }));
}

function fadeInOut(target, { inAt, inDur = 0.5, outAt, outDur = 0.5, y = 0, x = 0, ease = "ease-in-out" }) {
  const total = outAt + outDur - inAt;
  const t1 = inDur / total;
  const t2 = (outAt - inAt) / total;
  const opacity = [0, 1, 1, 0];
  const times = [0, t1, t2, 1];
  const transform = {};
  if (y) transform.y = [y, 0, 0, -y];
  if (x) transform.x = [x, 0, 0, -x];
  controls.push(animate(target, { opacity, ...transform }, { delay: inAt, duration: total, times, ease }));
}

function panY(target, { at, dur, to, ease = "linear" }) {
  controls.push(animate(target, { y: [0, to] }, { delay: at, duration: dur, ease }));
}

function grow(target, { at, dur, from = 0, ease = OVERSHOOT }) {
  controls.push(animate(target, { scale: [from, 1], opacity: [0, 1] }, { delay: at, duration: dur, ease }));
}

function widthGrow(target, { at, dur, to, unit = "px" }) {
  controls.push(animate(target, { width: [`0${unit}`, `${to}${unit}`] }, { delay: at, duration: dur, ease: "steps(12, end)" }));
}

function wipeReveal(id, { at, dur }) {
  controls.push(animate(`#mask-${id}`, { x: ["0%", "100%"] }, { delay: at, duration: dur, ease: "ease-in-out" }));
}

// Panel schedule: slide in a bit before its beat starts, hold through the
// speech, slide out just before the next beat begins.
const order = ["hook1", "hook2", "value1", "bridge", "ai1", "recap1", "recap2", "cta"];
const panelIds = {
  hook1: "#p-hook1", hook2: "#p-hook2", value1: "#p-value", bridge: "#p-bridge",
  ai1: "#p-ai", recap1: "#p-recap1", recap2: "#p-recap2", cta: "#p-outro",
};

const OUTRO_HOLD = 3.6;
const END_FADE_DUR = 0.6;
const lastBeat = beat.cta;
const TOTAL_DURATION = lastBeat.start + lastBeat.duration + OUTRO_HOLD + END_FADE_DUR;

order.forEach((id, i) => {
  const b = beat[id];
  const inAt = Math.max(0.15, b.start - 0.4);
  const isLast = i === order.length - 1;
  if (isLast) {
    fadeIn(panelIds[id], { at: inAt, dur: 0.6, y: 1920, ease: "ease-out" });
  } else {
    const nextB = beat[order[i + 1]];
    const outAt = nextB.start - 0.45;
    fadeInOut(panelIds[id], { inAt, inDur: 0.55, outAt, outDur: 0.45, y: 1920, ease: "ease-out" });
  }
});

fadeIn(".header", { at: beat.hook1.start + 0.3, dur: 0.5 });

// ---------- hook1: search mockup ----------
fadeIn("#p-hook1 .eyebrow", { at: beat.hook1.start - 0.2, dur: 0.4, y: 10 });
grow(".search-mock", { at: beat.hook1.start, dur: 0.4, from: 0.92 });
widthGrow("#search-typed", { at: beat.hook1.start + 0.3, dur: 1.0, to: 430 });
els(".result-row").forEach((r, i) => fadeIn(r, { at: beat.hook1.start + 1.5 + i * 0.25, dur: 0.35 }));

// ---------- hook2: empty state ----------
fadeIn(".empty-browser", { at: beat.hook2.start, dur: 0.5, scale: 0.94 });
fadeIn(".invisible-tag", { at: beat.hook2.start + 0.9, dur: 0.5, y: 14 });

// ---------- value1: product mockup ----------
fadeIn("#p-value .eyebrow", { at: beat.value1.start - 0.1, dur: 0.4, y: 10 });
fadeIn("#mockup-laptop", { at: beat.value1.start + 0.2, dur: 0.5, scale: 0.92 });
panY("#shot-desktop", { at: beat.value1.start + 0.7, dur: beat.value1.duration + 1.2, to: -1500, ease: "linear" });

// ---------- bridge ----------
grow("#bridge-logo", { at: beat.bridge.start, dur: 0.5, from: 0.5 });

// ---------- ai1: workflow diagram ----------
fadeIn("#p-ai .eyebrow", { at: beat.ai1.start - 0.1, dur: 0.4, y: 10 });
fadeIn(".diagram-wrap svg", { at: beat.ai1.start + 0.2, dur: 0.6, scale: 0.94 });

// ---------- recap1: kinetic statement ----------
wipeReveal("r1a", { at: beat.recap1.start, dur: 0.45 });
wipeReveal("r1b", { at: beat.recap1.start + 0.75, dur: 0.45 });
wipeReveal("r1c", { at: beat.recap1.start + 1.5, dur: 0.45 });

// ---------- recap2: single point of contact ----------
fadeIn(".link-wrap svg", { at: beat.recap2.start, dur: 0.5, scale: 0.94 });

// ---------- cta: outro ----------
const ctaStart = beat.cta.start;
fadeIn(".outro-brand", { at: ctaStart + 0.5, dur: 0.6, y: 16 });
fadeIn(".outro-tag", { at: ctaStart + 1.0, dur: 0.5, y: 10 });
fadeIn(".outro-contact", { at: ctaStart + 1.4, dur: 0.5, y: 10 });
fadeIn(".outro-cta", { at: ctaStart + 1.9, dur: 0.5, scale: 0.9 });
fadeIn(".outro-qr", { at: ctaStart + 2.3, dur: 0.5, y: 10 });
controls.push(
  animate(".cta-btn", { scale: [1, 1, 1.035, 1, 1.035, 1] }, { delay: ctaStart + 2.3, duration: 3.0, times: [0, 0.15, 0.4, 0.55, 0.8, 1], ease: "ease-in-out" })
);

// ---------- background drift ----------
controls.push(animate(".grid-bg", { scale: [1, 1.06] }, { delay: 0, duration: TOTAL_DURATION, ease: "linear" }));

// ---------- end fade ----------
fadeIn(".end-fade", { at: TOTAL_DURATION - END_FADE_DUR, dur: END_FADE_DUR });

for (const c of controls) c.pause();

// ---------- subtitles (handled directly per-frame, not via Motion) ----------
const subtitleEls = Object.fromEntries(timelineData.map((b) => [b.id, document.getElementById(`sub-${b.id}`)]));

window.__setTime = (t) => {
  for (const c of controls) c.time = t;
  for (const b of timelineData) {
    const elSub = subtitleEls[b.id];
    if (!elSub) continue;
    const active = t >= b.start - 0.05 && t <= b.start + b.duration + 0.15;
    if (active) {
      elSub.classList.add("is-active");
      const fadeIn = Math.min(1, (t - (b.start - 0.05)) / 0.25);
      const fadeOut = Math.min(1, (b.start + b.duration + 0.15 - t) / 0.25);
      elSub.style.opacity = String(Math.max(0, Math.min(fadeIn, fadeOut)));
    } else {
      elSub.classList.remove("is-active");
      elSub.style.opacity = "0";
    }
  }
};
window.__ready = true;
window.__duration = TOTAL_DURATION;
console.log("TOTAL_DURATION", TOTAL_DURATION);
