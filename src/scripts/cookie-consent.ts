const STORAGE_KEY = "cookie-consent";

type Consent = "granted" | "denied";

function loadGoogleAnalytics(gaId: string) {
  if (document.getElementById("ga-gtag-script")) return;

  const script = document.createElement("script");
  script.id = "ga-gtag-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  const win = window as typeof window & { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
  win.dataLayer = win.dataLayer || [];
  // gtag.js n'accepte que l'objet `arguments` : pousser un vrai tableau
  // (`...args`) fait silencieusement ignorer tous les événements — c'est ce qui
  // empêchait toute mesure d'audience jusqu'ici.
  win.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    win.dataLayer.push(arguments);
  } as typeof win.gtag;
  win.gtag("js", new Date());
  win.gtag("config", gaId, { anonymize_ip: true, send_page_view: false });
  trackPageview(gaId);
}

function trackPageview(gaId: string) {
  const win = window as typeof window & { gtag?: (...args: unknown[]) => void };
  if (!win.gtag) return;
  win.gtag("event", "page_view", {
    page_path: window.location.pathname,
    page_title: document.title,
    page_location: window.location.href,
    send_to: gaId,
  });
}

// Le choix (accord ou refus) est redemandé au bout de 13 mois (recommandation CNIL).
const DATE_KEY = "cookie-consent-date";
const MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;

function saveConsent(value: Consent) {
  localStorage.setItem(STORAGE_KEY, value);
  localStorage.setItem(DATE_KEY, String(Date.now()));
}

function readConsent(): Consent | null {
  const value = localStorage.getItem(STORAGE_KEY) as Consent | null;
  const date = Number(localStorage.getItem(DATE_KEY));
  if (value && (!date || Date.now() - date > MAX_AGE_MS)) {
    if (!date) localStorage.setItem(DATE_KEY, String(Date.now())); // choix antérieur à la date mémorisée
    else return null;
  }
  return value;
}

export function initCookieConsent(gaId: string) {
  const consent = readConsent();

  if (consent === "granted") {
    (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = false;
    if (document.getElementById("ga-gtag-script")) {
      trackPageview(gaId);
    } else {
      loadGoogleAnalytics(gaId);
    }
  }

  const banner = document.getElementById("cookie-consent");
  const acceptBtn = document.getElementById("cookie-accept");
  const refuseBtn = document.getElementById("cookie-refuse");
  if (!banner || !acceptBtn || !refuseBtn) return;

  // Lien "Gérer les cookies" (pied de page) : retirer ou redonner son accord
  // à tout moment, aussi simplement qu'on l'a donné (exigence CNIL).
  document.querySelectorAll<HTMLElement>("[data-cookie-manage]").forEach((el) => {
    if (el.dataset.wired === "true") return;
    el.dataset.wired = "true";
    el.addEventListener("click", (e) => {
      e.preventDefault();
      banner.hidden = false;
      acceptBtn.focus();
    });
  });

  if (!consent) {
    banner.hidden = false;
  }

  if (banner.dataset.wired === "true") return;
  banner.dataset.wired = "true";

  acceptBtn.addEventListener("click", () => {
    saveConsent("granted");
    banner.hidden = true;
    (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = false;
    loadGoogleAnalytics(gaId);
  });

  refuseBtn.addEventListener("click", () => {
    saveConsent("denied");
    banner.hidden = true;
    // Si le visiteur retire un accord donné plus tôt, Analytics cesse
    // immédiatement d'envoyer quoi que ce soit (drapeau officiel gtag).
    (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = true;
  });
}
