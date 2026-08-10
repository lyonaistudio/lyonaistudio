export function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!toggle || !menu || toggle.dataset.menuInit) return;
  toggle.dataset.menuInit = "true";

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("flex");
    menu.classList.toggle("hidden");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}
