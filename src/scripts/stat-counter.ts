function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function animateCount(el: HTMLElement) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix ?? "";
  const duration = 1100;
  const start = performance.now();

  function frame(now: number) {
    const t = Math.min((now - start) / duration, 1);
    const value = Math.round(easeOutExpo(t) * target);
    el.textContent = `${value}${suffix}`;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export function initStatCounters() {
  const targets = document.querySelectorAll<HTMLElement>("[data-count]:not([data-counted])");
  if (!targets.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.dataset.counted = "true";
          if (reduceMotion) {
            el.textContent = `${el.dataset.count}${el.dataset.suffix ?? ""}`;
          } else {
            animateCount(el);
          }
          observer.unobserve(el);
        }
      }
    },
    { threshold: 0.4 }
  );

  targets.forEach((el) => observer.observe(el));
}
