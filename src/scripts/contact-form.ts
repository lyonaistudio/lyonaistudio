// Worker Cloudflare qui écrit le lead dans le Google Sheet via un compte de
// service (voir scripts/cloudflare-worker/) — remplace l'ancien webhook
// Make.com, dont la connexion Google était cassée de façon permanente.
const CONTACT_RELAY_URL = "https://contact-relay.lyonaistudio.workers.dev";

// Le worker attend des clés sans espace/accent ; Formspree reçoit lui les
// noms de champs originaux (accentués/espacés), non affecté par ceci.
const RELAY_KEY_ALIASES: Record<string, string> = {
  "Type d'entreprise": "TypeEntreprise",
  "Secteur d'activité": "SecteurActivite",
};

function notifyRelay(form: HTMLFormElement) {
  const data = new FormData(form);
  const payload: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (key === "_gotcha" || typeof value !== "string") continue;
    payload[RELAY_KEY_ALIASES[key] ?? key] = value;
  }
  fetch(CONTACT_RELAY_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch((err) => {
    // Best-effort : Formspree a déjà la demande (email envoyé), donc une
    // panne ici ne perd pas le lead — juste pas de trace dans le Sheet.
    console.error("notifyRelay failed", err);
  });
}

// Bots that fill and submit a form in well under a second are extremely
// common. This costs nothing (no external service, no user friction) and
// catches the least sophisticated traffic on top of the honeypot field.
const MIN_FILL_TIME_MS = 2500;
let formRenderedAt = 0;

export function initContactForm() {
  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  const successBanner = document.getElementById("success-banner");
  const errorBanner = document.getElementById("error-banner");
  const submitBtn = document.getElementById("contact-submit") as HTMLButtonElement | null;
  if (!form || form.dataset.init) return;
  form.dataset.init = "true";
  formRenderedAt = Date.now();

  const submitLabel = submitBtn?.textContent ?? "Envoyer la demande";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBanner?.classList.add("hidden");

    if (Date.now() - formRenderedAt < MIN_FILL_TIME_MS) {
      // Behaves like a normal successful submission from the bot's point of
      // view (no error, no retry signal) while never actually sending
      // anything — no benefit to the bot in adapting.
      form.classList.add("hidden");
      successBanner?.classList.remove("hidden");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi en cours…";
    }

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        notifyRelay(form);
        form.classList.add("hidden");
        successBanner?.classList.remove("hidden");
      } else {
        throw new Error(`Formspree a répondu avec le statut ${res.status}`);
      }
    } catch {
      errorBanner?.classList.remove("hidden");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    }
  });
}
