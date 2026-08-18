const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/gv5ror2kws485nk7je3a5amweqt2qxfx";

// Make's formula syntax breaks on field names containing spaces, so the
// keys sent to the automation webhook are simplified (Formspree still gets
// the original accented/spaced field names, unaffected by this).
const MAKE_KEY_ALIASES: Record<string, string> = {
  "Type d'entreprise": "TypeEntreprise",
  "Secteur d'activité": "SecteurActivite",
};

function notifyMake(form: HTMLFormElement) {
  const data = new FormData(form);
  const payload: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (key === "_gotcha" || typeof value !== "string") continue;
    payload[MAKE_KEY_ALIASES[key] ?? key] = value;
  }
  fetch(MAKE_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch((err) => {
    // Best-effort: Formspree already has the submission, so a failure here
    // doesn't lose the lead — but it's worth surfacing in the console for
    // debugging rather than disappearing entirely.
    console.error("notifyMake failed", err);
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
        notifyMake(form);
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
