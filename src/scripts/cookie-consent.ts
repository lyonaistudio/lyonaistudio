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
  win.gtag = function gtag(...args: unknown[]) {
    win.dataLayer.push(args);
  };
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

export function initCookieConsent(gaId: string) {
  const consent = localStorage.getItem(STORAGE_KEY) as Consent | null;

  if (consent === "granted") {
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

  if (!consent) {
    banner.hidden = false;
  }

  if (banner.dataset.wired === "true") return;
  banner.dataset.wired = "true";

  acceptBtn.addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEY, "granted");
    banner.hidden = true;
    loadGoogleAnalytics(gaId);
  });

  refuseBtn.addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEY, "denied");
    banner.hidden = true;
  });
}
