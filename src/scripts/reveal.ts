export function initRevealObserver() {
  const targets = document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}
