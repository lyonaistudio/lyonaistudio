export function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const main = document.getElementById("main");
  const footer = document.querySelector("footer");
  if (!toggle || !menu || toggle.dataset.menuInit) return;
  toggle.dataset.menuInit = "true";

  function setOpen(isOpen: boolean) {
    menu!.classList.toggle("flex", isOpen);
    menu!.classList.toggle("hidden", !isOpen);
    toggle!.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggle!.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    // Keeps screen-reader / keyboard focus out of the page behind the
    // full-screen overlay while it's open (menu itself sits above it in the
    // DOM so it stays reachable).
    for (const el of [main, footer]) el?.toggleAttribute("inert", isOpen);
    if (isOpen) {
      menu!.querySelector("a")?.focus();
    } else {
      toggle!.focus();
    }
  }

  toggle.addEventListener("click", () => {
    setOpen(!menu!.classList.contains("flex"));
  });

  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
}
