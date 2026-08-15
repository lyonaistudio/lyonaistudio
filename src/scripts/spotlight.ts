export function initSpotlight() {
  document.querySelectorAll<HTMLElement>("[data-spotlight]").forEach((el) => {
    if (el.dataset.spotlightWired) return;
    el.dataset.spotlightWired = "true";

    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--sx", `${x}%`);
      el.style.setProperty("--sy", `${y}%`);
    });
  });
}
