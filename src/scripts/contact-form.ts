const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/gv5ror2kws485nk7je3a5amweqt2qxfx";

function notifyMake(form: HTMLFormElement) {
  const data = new FormData(form);
  const payload: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (key === "_gotcha" || typeof value !== "string") continue;
    payload[key] = value;
  }
  fetch(MAKE_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}

export function initContactForm() {
  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  const successBanner = document.getElementById("success-banner");
  const errorBanner = document.getElementById("error-banner");
  const submitBtn = document.getElementById("contact-submit") as HTMLButtonElement | null;
  if (!form || form.dataset.init) return;
  form.dataset.init = "true";

  const submitLabel = submitBtn?.textContent ?? "Envoyer la demande";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBanner?.classList.add("hidden");
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
