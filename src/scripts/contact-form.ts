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

// Envoyé en parallèle de Formspree, et non après : si Formspree refuse
// (quota du plan gratuit atteint, panne), le lead arrive quand même dans le
// Sheet + Telegram. Résout à true si le Worker a bien enregistré le lead.
async function notifyRelay(form: HTMLFormElement): Promise<boolean> {
  const data = new FormData(form);
  const payload: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (key === "_gotcha" || typeof value !== "string") continue;
    payload[RELAY_KEY_ALIASES[key] ?? key] = value;
  }
  try {
    const res = await fetch(CONTACT_RELAY_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    });
    return res.ok;
  } catch (err) {
    console.error("notifyRelay failed", err);
    return false;
  }
}

async function sendToFormspree(form: HTMLFormElement): Promise<boolean> {
  try {
    const res = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) console.error(`Formspree a répondu avec le statut ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error("Formspree injoignable", err);
    return false;
  }
}

// Bots that fill and submit a form in well under a second are extremely
// common. This costs nothing (no external service, no user friction) and
// catches the least sophisticated traffic on top of the honeypot field.
const MIN_FILL_TIME_MS = 2500;

// `prefix` permet d'avoir plusieurs formulaires sur le site (page Contact :
// "", accueil : "home-") avec exactement le même comportement : envoi AJAX à
// Formspree et au Worker (Sheet + Telegram + accusé de réception) en
// parallèle, puis bannière sur place. Ids attendus : {prefix}contact-form, {prefix}success-banner,
// {prefix}error-banner, {prefix}contact-submit.
export function initContactForm(prefix = "") {
  const form = document.getElementById(`${prefix}contact-form`) as HTMLFormElement | null;
  const successBanner = document.getElementById(`${prefix}success-banner`);
  const errorBanner = document.getElementById(`${prefix}error-banner`);
  const submitBtn = document.getElementById(`${prefix}contact-submit`) as HTMLButtonElement | null;
  if (!form || form.dataset.init) return;
  form.dataset.init = "true";
  const formRenderedAt = Date.now();

  const submitLabel = submitBtn?.textContent ?? "Envoyer ma demande";

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

    // Le lead est reçu dès qu'un des deux canaux l'a enregistré : on
    // n'affiche l'erreur (et ne propose de renvoyer) que si les deux ont échoué.
    const [formspreeOk, relayOk] = await Promise.all([sendToFormspree(form), notifyRelay(form)]);

    if (formspreeOk || relayOk) {
      form.classList.add("hidden");
      successBanner?.classList.remove("hidden");
    } else {
      errorBanner?.classList.remove("hidden");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    }
  });
}
