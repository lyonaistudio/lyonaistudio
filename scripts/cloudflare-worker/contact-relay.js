// Worker Cloudflare qui reçoit les soumissions du formulaire de contact
// (en plus de Formspree, qui reste le chemin principal et gère déjà l'email)
// et : 1) les écrit directement dans le Google Sheet "leads" via un compte
// de service Google, 2) envoie une notification Telegram (et WhatsApp si configuré) — sans dépendre
// de Make.com, dont la connexion Google est morte de façon permanente.
//
// Déploiement (~5 minutes, nécessite un compte Cloudflare gratuit) :
//   1. npm install -g wrangler
//   2. cd scripts/cloudflare-worker && wrangler login
//   3. wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
//      (coller tout le contenu du fichier
//      "cle api/lyon-ai-studio-prospection-9345a0c6de0b.json")
//   4. wrangler secret put TELEGRAM_BOT_TOKEN (token @BotFather)
//   5. wrangler secret put TELEGRAM_CHAT_ID (chat_id récupéré via getUpdates
//      après avoir envoyé un message au bot une première fois)
//   5b. (optionnel, WhatsApp) wrangler secret put WHATSAPP_PHONE (+33…)
//       et wrangler secret put CALLMEBOT_APIKEY (clé reçue de CallMeBot)
//   5c. (optionnel, Signal) wrangler secret put SIGNAL_PHONE et SIGNAL_APIKEY
//   5d. (optionnel, accusé de réception au client) wrangler secret put
//       GMAIL_USER et GMAIL_APP_PASSWORD (mot de passe d'application Google)
//   6. wrangler deploy
//   7. Noter l'URL affichée (ex. contact-relay.<compte>.workers.dev),
//      la mettre dans src/scripts/contact-form.ts à la place de l'appel
//      direct à Make, puis redéployer le site.
//   8. Partager le Google Sheet "Mes demandes de renseignement" en Éditeur
//      avec claude-sheets@lyon-ai-studio-prospection.iam.gserviceaccount.com
//      (déjà fait au moment de l'écriture de ce script).

import { WorkerMailer } from "worker-mailer";

const ALLOWED_ORIGIN = "https://lyonaistudio.fr";
const SHEET_TAB = "Feuille 1";

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
    // Origin absent = requête hors navigateur (curl, script) : refusée aussi.
    const origin = request.headers.get("Origin");
    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    try {
      const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const token = await getAccessToken(sa);

      const now = new Date();
      const date =
        now.toLocaleDateString("fr-FR") +
        " " +
        now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

      const row = [
        date,
        sanitizeCell(payload["Nom"]),
        sanitizeCell(payload["Prénom"]),
        sanitizeCell(payload["Email"]),
        sanitizeCell(payload["TypeEntreprise"]),
        "",
        sanitizeCell(payload["SecteurActivite"]),
        sanitizeCell(payload["Message"]),
        "Nouveau",
      ];

      const res = await fetch(
        // RAW (pas USER_ENTERED) : le contenu du formulaire est écrit tel
        // quel, jamais interprété comme une formule par Sheets. Nécessaire
        // car un champ commençant par =, +, - ou @ serait sinon exécuté
        // comme formule (ex. =HYPERLINK(...) pour du phishing, ou pire).
        `https://sheets.googleapis.com/v4/spreadsheets/${env.LEADS_SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}!A1:append?valueInputOption=RAW`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ values: [row] }),
        }
      );

      // Best-effort : une panne Telegram/WhatsApp ne doit jamais faire
      // échouer la réponse — le Sheet (source de vérité) est déjà écrit.
      // allSettled : l'un des deux canaux en panne n'empêche pas l'autre.
      const text = formatLead(payload);
      await Promise.allSettled([
        notifyTelegram(env, text),
        notifyWhatsApp(env, text),
        notifySignal(env, text),
        sendAutoReply(env, payload["Email"]),
      ]);

      return new Response(null, { status: res.ok ? 204 : 502, headers: corsHeaders() });
    } catch {
      return new Response(null, { status: 502, headers: corsHeaders() });
    }
  },
};

// Ceinture-bretelles en plus de valueInputOption=RAW : neutralise un
// caractère de tête qu'un humain qui rouvre/retape la cellule dans Sheets
// pourrait faire réinterpréter comme une formule.
function sanitizeCell(value) {
  const str = value ?? "";
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

// ---- Notifications Telegram + WhatsApp + Signal (best-effort, voir l'appel ci-dessus) ----

function formatLead(payload) {
  const nom = [payload["Prénom"], payload["Nom"]].filter(Boolean).join(" ");
  return [
    "🆕 Nouvelle demande — Lyon AI Studio",
    "",
    nom && `Nom : ${nom}`,
    payload["Email"] && `Email : ${payload["Email"]}`,
    payload["TypeEntreprise"] && `Type d'entreprise : ${payload["TypeEntreprise"]}`,
    payload["SecteurActivite"] && `Secteur : ${payload["SecteurActivite"]}`,
    payload["Message"] && `\nMessage :\n${payload["Message"]}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function notifyTelegram(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
  });
}

// CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/) :
// service gratuit non officiel pour s'envoyer des WhatsApp à soi-même.
// Inactif tant que les secrets WHATSAPP_PHONE (+33…) et CALLMEBOT_APIKEY
// ne sont pas définis — Telegram reste le canal de secours.
async function notifyWhatsApp(env, text) {
  if (!env.WHATSAPP_PHONE || !env.CALLMEBOT_APIKEY) return;
  const params = new URLSearchParams({
    phone: env.WHATSAPP_PHONE,
    apikey: env.CALLMEBOT_APIKEY,
    text,
  });
  await fetch(`https://api.callmebot.com/whatsapp.php?${params}`);
}

// CallMeBot pour Signal (https://www.callmebot.com/blog/free-api-signal-send-messages/),
// même principe : inactif tant que SIGNAL_PHONE et SIGNAL_APIKEY ne sont
// pas définis (activation : envoyer le message d'autorisation en Signal au
// +34 644 52 74 88).
async function notifySignal(env, text) {
  if (!env.SIGNAL_PHONE || !env.SIGNAL_APIKEY) return;
  const params = new URLSearchParams({
    phone: env.SIGNAL_PHONE,
    apikey: env.SIGNAL_APIKEY,
    text,
  });
  await fetch(`https://signal.callmebot.com/signal/send.php?${params}`);
}

// ---- Accusé de réception envoyé au client, depuis le Gmail du studio ----
// SMTP Gmail + mot de passe d'application (gratuit, 500 envois/jour, les
// réponses du client arrivent directement dans la boîte Gmail). Inactif tant
// que GMAIL_USER et GMAIL_APP_PASSWORD ne sont pas définis.
// Texte volontairement fixe, sans rien recopier du formulaire : le Worker ne
// peut pas servir à envoyer un contenu choisi par un tiers.

const EMAIL_RE = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,}$/i;

const AUTO_REPLY_TEXT = `Bonjour,

Merci pour votre message ! Nous avons bien reçu votre demande et nous revenons vers vous sous 24 à 48 h ouvrées.

À très vite,
Lyon AI Studio
https://lyonaistudio.fr`;

async function sendAutoReply(env, email) {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return;
  if (!email || !EMAIL_RE.test(email)) return;

  const mailer = await WorkerMailer.connect({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    credentials: { username: env.GMAIL_USER, password: env.GMAIL_APP_PASSWORD },
    authType: "plain",
  });
  try {
    await mailer.send({
      from: { name: "Lyon AI Studio", email: env.GMAIL_USER },
      to: { email },
      subject: "Votre demande a bien été reçue — Lyon AI Studio",
      text: AUTO_REPLY_TEXT,
    });
  } finally {
    await mailer.close();
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ---- Auth compte de service Google, via Web Crypto (pas de node:crypto en Worker) ----

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const enc = (obj) => base64url(new TextEncoder().encode(JSON.stringify(obj)));
  const unsigned = `${enc(header)}.${enc(claims)}`;

  const key = await importPrivateKey(sa.private_key);
  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${base64url(new Uint8Array(sigBuf))}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("token exchange failed");
  return data.access_token;
}

function base64url(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}
