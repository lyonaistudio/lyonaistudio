export function initMagnetic() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll<HTMLElement>(".magnetic:not([data-magnetic-init])").forEach((el) => {
    el.dataset.magneticInit = "true";
    const strength = 0.35;
    const max = 14;

    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-max, Math.min(max, relX * strength));
      const y = Math.max(-max, Math.min(max, relY * strength));
      el.style.transform = `translate(${x}px, ${y}px)`;
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0, 0)";
    });
  });
}
