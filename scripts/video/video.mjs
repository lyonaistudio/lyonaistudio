import { animate } from "motion";

const controls = [];
const OVERSHOOT = "cubic-bezier(0.34, 1.56, 0.64, 1)";

function el(sel) {
  return document.querySelector(sel);
}
function els(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function fadeIn(target, { at, dur = 0.5, y = 0, x = 0, scale, ease = "ease-out" }) {
  const opacity = [0, 1];
  const transform = {};
  if (y) transform.y = [y, 0];
  if (x) transform.x = [x, 0];
  if (scale) transform.scale = [scale, 1];
  controls.push(animate(target, { opacity, ...transform }, { delay: at, duration: dur, ease }));
}

function fadeOut(target, { at, dur = 0.5, ease = "ease-in" }) {
  controls.push(animate(target, { opacity: [1, 0] }, { delay: at, duration: dur, ease }));
}

function slideOut(target, { at, dur = 0.5, y = 0, x = 0, ease = "ease-in" }) {
  const transform = {};
  if (y) transform.y = [0, y];
  if (x) transform.x = [0, x];
  controls.push(animate(target, transform, { delay: at, duration: dur, ease }));
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

function moveVanish(target, { at, dur, toX, toY, ease = "ease-in" }) {
  controls.push(
    animate(target, { x: [0, toX], y: [0, toY], scale: [1, 0.3], opacity: [1, 0] }, { delay: at, duration: dur, ease })
  );
}

function widthGrow(target, { at, dur, to }) {
  controls.push(animate(target, { width: [0, to] }, { delay: at, duration: dur, ease: "ease-out" }));
}

function wipeReveal(id, { at, dur }) {
  controls.push(
    animate(`#mask-${id}`, { x: ["0%", "100%"] }, { delay: at, duration: dur, ease: "ease-in-out" })
  );
}

// ================= TIMELINE =================

// ---------- P0 : hook (visible from frame 0, no entrance) ----------
grow(".hook-pill:nth-of-type(1)", { at: 0.05, dur: 0.3, from: 0.4 });
grow(".hook-pill:nth-of-type(2)", { at: 0.25, dur: 0.3, from: 0.4 });
grow(".hook-pill:nth-of-type(3)", { at: 0.45, dur: 0.3, from: 0.4 });

moveVanish(".hook-pill:nth-of-type(1)", { at: 1.0, dur: 0.35, toX: 450, toY: 590 });
moveVanish(".hook-pill:nth-of-type(2)", { at: 1.0, dur: 0.35, toX: -250, toY: 90 });
moveVanish(".hook-pill:nth-of-type(3)", { at: 1.0, dur: 0.35, toX: 400, toY: -420 });
grow(".hook-dot", { at: 1.1, dur: 0.35, from: 0 });

slideOut("#p-hook", { at: 1.55, dur: 0.5, y: -1920 });

// ---------- P1 : logo intro ----------
fadeInOut("#p-intro", { inAt: 1.55, inDur: 0.6, outAt: 4.6, outDur: 0.5, y: 1920, ease: "ease-out" });
grow(".intro-logo", { at: 2.0, dur: 0.5 });
wipeReveal("intro-word", { at: 2.5, dur: 0.5 });
fadeIn(".intro-tag", { at: 3.1, dur: 0.4, y: 10 });
widthGrow("#intro-underline", { at: 3.4, dur: 0.3, to: 140 });

// ---------- Persistent header ----------
fadeIn(".header", { at: 4.3, dur: 0.5 });

// ---------- P2 : value proposition ----------
fadeInOut("#p-value", { inAt: 4.6, inDur: 0.6, outAt: 9.6, outDur: 0.5, y: 1920, ease: "ease-out" });
fadeIn("#p-value .eyebrow", { at: 5.0, dur: 0.4, y: 12 });
wipeReveal("h1", { at: 5.4, dur: 0.45 });
wipeReveal("h2", { at: 5.8, dur: 0.45 });
wipeReveal("h3", { at: 6.2, dur: 0.45 });
fadeIn("#value-sub", { at: 7.2, dur: 0.5, y: 16 });

// ---------- P3 : product mockups ----------
fadeInOut("#p-product", { inAt: 9.6, inDur: 0.6, outAt: 15.6, outDur: 0.5, y: 1920, ease: "ease-out" });
fadeIn("#p-product .eyebrow", { at: 10.0, dur: 0.4, y: 12 });

fadeInOut("#mockup-laptop", { inAt: 10.3, inDur: 0.5, outAt: 13.3, outDur: 0.4, scale: 0 });
panY("#shot-desktop", { at: 10.8, dur: 3.4, to: -1500 });

fadeInOut("#mockup-phone", { inAt: 13.3, inDur: 0.5, outAt: 15.6, outDur: 0.4 });
panY("#shot-mobile", { at: 13.8, dur: 1.8, to: -4200 });

// ---------- P4 : services ----------
fadeInOut("#p-services", { inAt: 15.6, inDur: 0.6, outAt: 21.6, outDur: 0.5, y: 1920, ease: "ease-out" });
fadeIn("#p-services .eyebrow", { at: 16.0, dur: 0.4, y: 12 });
fadeIn("#p-services .headline2", { at: 16.3, dur: 0.5, y: 20 });

fadeInOut("#s1", { inAt: 16.7, inDur: 0.5, outAt: 19.1, outDur: 0.4, x: -70 });
els("#s1 .bullet").forEach((b, i) => fadeInOut(b, { inAt: 17.2 + i * 0.22, inDur: 0.35, outAt: 19.1, outDur: 0.3, y: 10 }));

fadeInOut("#s2", { inAt: 19.1, inDur: 0.5, outAt: 21.1, outDur: 0.4, x: 70 });
els("#s2 .bullet").forEach((b, i) => fadeInOut(b, { inAt: 19.6 + i * 0.22, inDur: 0.35, outAt: 21.1, outDur: 0.3, y: 10 }));

// ---------- P5 : chat demo ----------
fadeInOut("#p-chat", { inAt: 21.6, inDur: 0.6, outAt: 25.1, outDur: 0.5, y: 1920, ease: "ease-out" });
fadeIn("#p-chat .eyebrow", { at: 22.0, dur: 0.4, y: 12 });
grow("#chat-in", { at: 22.5, dur: 0.4, from: 0.6 });
fadeIn("#chat-badge", { at: 23.1, dur: 0.3 });
grow("#chat-out", { at: 23.4, dur: 0.4, from: 0.6 });

// ---------- P6 : steps ----------
fadeInOut("#p-steps", { inAt: 25.1, inDur: 0.6, outAt: 29.1, outDur: 0.5, y: 1920, ease: "ease-out" });
fadeIn("#p-steps .eyebrow", { at: 25.5, dur: 0.4, y: 12 });
fadeIn("#step1", { at: 25.9, dur: 0.4, x: -90, ease: OVERSHOOT });
fadeIn("#step2", { at: 26.4, dur: 0.4, x: 90, ease: OVERSHOOT });
fadeIn("#step3", { at: 26.9, dur: 0.4, x: -90, ease: OVERSHOOT });
fadeIn("#step4", { at: 27.4, dur: 0.4, x: 90, ease: OVERSHOOT });

// ---------- P7 : outro ----------
fadeIn("#p-outro", { at: 29.1, dur: 0.6, y: 1920, ease: "ease-out" });
fadeIn(".outro-brand", { at: 29.7, dur: 0.5, y: 16 });
fadeIn(".outro-tag", { at: 30.2, dur: 0.4, y: 10 });
fadeIn(".outro-contact", { at: 30.6, dur: 0.4, y: 10 });
fadeIn(".outro-cta", { at: 31.0, dur: 0.4, scale: 0.85 });
fadeIn(".outro-qr", { at: 31.4, dur: 0.4, y: 10 });

// CTA gentle pulse loop (explicit repeated keyframes, since we never play in real time)
controls.push(
  animate(
    ".cta-btn",
    { scale: [1, 1, 1.035, 1, 1.035, 1] },
    { delay: 31.4, duration: 3.0, times: [0, 0.15, 0.4, 0.55, 0.8, 1], ease: "ease-in-out" }
  )
);

// QR scan-line sweep, two passes
controls.push(
  animate(
    "#qr-scan",
    { y: [0, 220, 0, 220] },
    { delay: 31.8, duration: 2.6, times: [0, 0.45, 0.5, 0.95], ease: "ease-in-out" }
  )
);
fadeIn("#qr-scan", { at: 31.8, dur: 0.2 });

// ---------- Continuous background drift ----------
controls.push(animate(".grid-bg", { scale: [1, 1.08] }, { delay: 0, duration: 34.5, ease: "linear" }));

// ---------- End fade to black ----------
fadeIn(".end-fade", { at: 33.9, dur: 0.6 });

// Motion animations autoplay in real time by default. Left unpaused, they keep
// drifting in the background for the whole (multi-minute) capture run and
// corrupt the deterministic scrub below. Pause every one immediately so only
// explicit .time assignments ever move them.
for (const c of controls) c.pause();

window.__setTime = (t) => {
  for (const c of controls) c.time = t;
};
window.__ready = true;
window.__duration = 34.5;
