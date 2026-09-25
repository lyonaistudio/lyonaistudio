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
        now.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) +
        " " +
        now.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });

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

const AUTO_REPLY_SUBJECT = "Votre demande a bien été reçue — Lyon AI Studio";

const AUTO_REPLY_TEXT = `Bonjour,

Nous vous remercions pour votre message et l'intérêt que vous portez à Lyon AI Studio.

Votre demande a bien été enregistrée. Elle sera lue personnellement et vous recevrez une réponse par email sous 48 heures ouvrées.

LES PROCHAINES ÉTAPES
1. Prise de contact — nous étudions votre demande et revenons vers vous.
2. Échange — un point ensemble pour bien comprendre votre activité et votre besoin.
3. Proposition — une solution et un devis détaillés, sans engagement.
4. Réalisation — mise en place, formation et 30 jours de suivi inclus.

Vous souhaitez compléter votre demande ? Il vous suffit de répondre directement à cet email.

Bien cordialement,

L'équipe Lyon AI Studio
HVTB Company
Lyon AI Studio — Création de sites web & agents IA
lyonaistudio@gmail.com
https://lyonaistudio.fr
Du lundi au vendredi, de 9h à 18h

---
Ce message vous est envoyé automatiquement suite à votre demande sur lyonaistudio.fr.`;

const STEPS = [
  ["Prise de contact", "Nous étudions votre demande et revenons vers vous."],
  ["Échange", "Un point ensemble pour bien comprendre votre activité et votre besoin."],
  ["Proposition", "Une solution et un devis détaillés, sans engagement."],
  ["Réalisation", "Mise en place, formation et 30 jours de suivi inclus."],
];

const AUTO_REPLY_HTML = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${AUTO_REPLY_SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <tr><td style="background:#0a0a0a;padding:24px 32px;">
    <span style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:.3px;">Lyon AI Studio</span><br>
    <span style="font-size:13px;color:#aaaaaa;">Création de sites web &amp; agents IA</span>
  </td></tr>
  <tr><td style="height:4px;background:#e6003a;line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="padding:32px 32px 8px;font-size:15px;line-height:1.6;">
    <p style="margin:0 0 16px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Nous vous remercions pour votre message et l'intérêt que vous portez à Lyon AI Studio.</p>
    <p style="margin:0 0 24px;">Votre demande a bien été enregistrée. Elle sera lue personnellement et vous recevrez une réponse par email <strong>sous 48&nbsp;heures ouvrées</strong>.</p>
  </td></tr>
  <tr><td style="padding:0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;">
      <tr><td style="padding:20px 20px 4px;font-size:12px;font-weight:bold;letter-spacing:1px;color:#e6003a;text-transform:uppercase;">Les prochaines étapes</td></tr>
      ${STEPS.map(([title, desc], i) => `<tr><td style="padding:10px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td valign="top" style="width:28px;"><span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:11px;background:#0a0a0a;color:#ffffff;font-size:12px;font-weight:bold;text-align:center;">${i + 1}</span></td>
          <td style="font-size:14px;line-height:1.5;"><strong>${title}</strong><br><span style="color:#4b5563;">${desc}</span></td>
        </tr></table>
      </td></tr>`).join("")}
      <tr><td style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 32px 8px;font-size:15px;line-height:1.6;">
    <p style="margin:0 0 24px;">Vous souhaitez compléter votre demande&nbsp;? Il vous suffit de répondre directement à cet email.</p>
    <p style="margin:0 0 4px;">Bien cordialement,</p>
  </td></tr>
  <tr><td style="padding:8px 32px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="border-left:3px solid #e6003a;padding-left:14px;font-size:14px;line-height:1.6;">
        <strong style="font-size:15px;">L'équipe Lyon AI Studio</strong><br>
        <span style="color:#4b5563;">HVTB Company</span><br>
        <a href="mailto:lyonaistudio@gmail.com" style="color:#e6003a;text-decoration:none;">lyonaistudio@gmail.com</a><br>
        <a href="https://lyonaistudio.fr" style="color:#e6003a;text-decoration:none;">lyonaistudio.fr</a><br>
        <span style="color:#6b7280;font-size:13px;">Du lundi au vendredi, de 9h à 18h</span>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;font-size:12px;line-height:1.5;color:#9ca3af;">
    Ce message vous est envoyé automatiquement suite à votre demande sur lyonaistudio.fr.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

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
      subject: AUTO_REPLY_SUBJECT,
      text: AUTO_REPLY_TEXT,
      html: AUTO_REPLY_HTML,
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
