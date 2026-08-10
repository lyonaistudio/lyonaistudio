const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/_-+<>";

function scrambleElement(el: HTMLElement) {
  const original = el.textContent ?? "";
  const duration = 650;
  const start = performance.now();

  function frame(now: number) {
    const progress = Math.min((now - start) / duration, 1);
    let out = "";
    for (let i = 0; i < original.length; i++) {
      const char = original[i];
      if (char === " " || char === "\n") {
        out += char;
        continue;
      }
      const revealAt = (i / original.length) * 0.7;
      out += progress > revealAt + 0.25 ? char : CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    el.textContent = out;
    if (progress < 1) requestAnimationFrame(frame);
    else el.textContent = original;
  }

  requestAnimationFrame(frame);
}

export function initScramble() {
  const targets = document.querySelectorAll<HTMLElement>("[data-scramble]:not([data-scrambled])");
  if (!targets.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach((el) => (el.dataset.scrambled = "true"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.dataset.scrambled = "true";
          scrambleElement(el);
          observer.unobserve(el);
        }
      }
    },
    { threshold: 0.4 }
  );

  targets.forEach((el) => observer.observe(el));
}
