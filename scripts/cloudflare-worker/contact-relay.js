// Proxy Cloudflare Worker pour l'automatisation Make.com du formulaire de
// contact. Résout le problème d'audit "webhook Make exposé côté client" :
// l'URL réelle du webhook devient un secret côté Worker au lieu d'être
// visible dans le JS bundlé du site.
//
// Le site (src/scripts/contact-form.ts) doit alors appeler l'URL de CE
// Worker au lieu d'appeler https://hook.eu1.make.com/... directement.
//
// Déploiement (~5 minutes, nécessite un compte Cloudflare gratuit) :
//   1. npm install -g wrangler
//   2. cd scripts/cloudflare-worker && wrangler login
//   3. wrangler secret put MAKE_WEBHOOK_URL
//      (coller https://hook.eu1.make.com/gv5ror2kws485nk7je3a5amweqt2qxfx)
//   4. wrangler deploy
//   5. Noter l'URL affichée (ex. contact-relay.<compte>.workers.dev),
//      la mettre dans src/scripts/contact-form.ts à la place de l'appel
//      direct à Make, puis redéployer le site.

const ALLOWED_ORIGIN = "https://lyonaistudio.fr";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Ne bloque pas un attaquant déterminé (l'Origin est falsifiable hors
    // navigateur), mais élimine tout le trafic de rejeu naïf/scripté qui ne
    // prend pas la peine de forger cet en-tête.
    const origin = request.headers.get("Origin");
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const res = await fetch(env.MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return new Response(null, {
      status: res.ok ? 204 : 502,
      headers: corsHeaders(),
    });
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
