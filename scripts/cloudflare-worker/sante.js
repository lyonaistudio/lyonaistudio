// Contrôle de santé du relais : une panne ne doit jamais rester silencieuse.
// 1. Surveillance de contact@ : après SEUIL échecs de suite (6 min), une alerte Telegram,
//    puis un message quand elle refonctionne. Une seule écriture KV par panne (quota KV gratuit).
// 2. Chaque jour à 7 h UTC : test des accès (Google Sheet des demandes, connexion SMTP OVH
//    et Gmail sans rien envoyer, bot Telegram). Alerte en cas d'échec ; le lundi, un message
//    « tout fonctionne » : s'il n'arrive pas, c'est que le relais lui-même est arrêté.
//    Si Telegram est en panne, l'alerte part par e-mail vers ADMIN_EMAIL.
//    Pour le lancer tout de suite : clé « sante-forcer » dans le KV ETAT, prise au passage suivant.
// 3. GET /sante (public) : état résumé, sans aucun détail sur les accès.
import { WorkerMailer } from "worker-mailer";

const SEUIL = 3;
const CLE_BOITE = "sante-boite";
const CLE_CONTROLE = "sante-controle";
const CLE_FORCER = "sante-forcer";

// Le contrôle quotidien est-il dû à ce passage ? (7 h 00 UTC, ou demandé à la main)
export async function controleDu(env, quand) {
  const d = new Date(quand);
  if (d.getUTCHours() === 7 && d.getUTCMinutes() === 0) return true;
  if (env.ETAT && (await env.ETAT.get(CLE_FORCER))) { await env.ETAT.delete(CLE_FORCER); return true; }
  return false;
}

const erreurDe = (e) => String((e && e.message) || e).slice(0, 200);
const heureParis = (d) => new Date(d).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" });

// Résultat de la surveillance de la boîte, appelé à chaque passage de la tâche planifiée
export async function suivreBoite(env, alerter, erreur) {
  if (!env.ETAT) return;
  const etat = JSON.parse((await env.ETAT.get(CLE_BOITE)) || "null");
  if (!erreur) {
    if (!etat) return;
    if (etat.alerte) await alerter(`✅ La surveillance de contact@lyonaistudio.fr refonctionne (en panne depuis le ${heureParis(etat.depuis)}).`);
    await env.ETAT.delete(CLE_BOITE);
    return;
  }
  if (etat && etat.alerte) return; // déjà signalée : on n'écrit plus rien jusqu'au retour à la normale
  const suivant = { echecs: ((etat && etat.echecs) || 0) + 1, depuis: (etat && etat.depuis) || Date.now(), erreur: erreurDe(erreur) };
  if (suivant.echecs >= SEUIL) {
    suivant.alerte = true;
    await alerter(`⚠️ Lyon AI Studio : les alertes des e-mails reçus sur contact@lyonaistudio.fr ne fonctionnent plus depuis le ${heureParis(suivant.depuis)}.\nErreur : ${suivant.erreur}\nCause probable : mot de passe de la boîte changé (mettre à jour le secret OVH_SMTP_PASSWORD du relais).`);
  }
  await env.ETAT.put(CLE_BOITE, JSON.stringify(suivant));
}

// Test quotidien des accès extérieurs du relais
export async function controleQuotidien(env, { getAccessToken, messageries, envoyerMail }, quand) {
  const tests = [];
  const tester = async (nom, fn) => {
    try { await fn(); tests.push({ nom, ok: true }); }
    catch (e) { tests.push({ nom, ok: false, erreur: erreurDe(e) }); }
  };

  await tester("Google Sheet des demandes", async () => {
    const token = await getAccessToken(JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON));
    const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.LEADS_SHEET_ID}?fields=properties.title`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`Google Sheets ${r.status}`);
  });
  for (const m of messageries(env)) {
    await tester(`Envoi d'e-mails (${m.host})`, async () => {
      const mailer = await WorkerMailer.connect({ host: m.host, port: 465, secure: true, credentials: { username: m.user, password: m.pass }, authType: "plain" });
      await mailer.close();
    });
  }
  let telegramOk = true;
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    await tester("Bot Telegram", async () => {
      const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
      if (!r.ok) throw new Error(`Telegram ${r.status}`);
    });
    telegramOk = tests[tests.length - 1].ok;
  }
  const boite = env.ETAT && JSON.parse((await env.ETAT.get(CLE_BOITE)) || "null");
  if (boite && boite.alerte) tests.push({ nom: "Surveillance de contact@", ok: false, erreur: boite.erreur });

  const echecs = tests.filter((t) => !t.ok);
  const lundi = new Date(quand).getUTCDay() === 1;
  let texte = "";
  if (echecs.length) {
    texte = `⚠️ Contrôle quotidien du relais Lyon AI Studio : ${echecs.length} problème(s)\n` +
      echecs.map((t) => `• ${t.nom} : ${t.erreur}`).join("\n") +
      "\nLes demandes du formulaire arrivent toujours par Formspree (e-mail), mais ce point est à corriger.";
  } else if (lundi) {
    texte = "✅ Contrôle hebdomadaire du relais Lyon AI Studio : formulaire de contact, Google Sheet, envoi d'e-mails, surveillance de contact@ et Telegram fonctionnent.";
  }
  if (texte) {
    let envoye = false;
    if (telegramOk && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: texte }),
      }).catch(() => null);
      envoye = !!(r && r.ok);
    }
    if (!envoye && echecs.length) {
      await envoyerMail(env, { to: { email: env.ADMIN_EMAIL || "lyonaistudio@gmail.com" }, subject: "⚠️ Relais Lyon AI Studio : problème détecté", text: texte }).catch((e) => console.log("alerte e-mail impossible :", erreurDe(e)));
    }
  }
  const resume = { date: quand, ok: !echecs.length, tests };
  if (env.ETAT) await env.ETAT.put(CLE_CONTROLE, JSON.stringify(resume));
  return resume;
}

// État public, volontairement résumé (aucune erreur ni nom de compte)
export async function etatPublic(env) {
  const controle = env.ETAT && JSON.parse((await env.ETAT.get(CLE_CONTROLE)) || "null");
  const boite = env.ETAT && JSON.parse((await env.ETAT.get(CLE_BOITE)) || "null");
  return {
    ok: !!(controle && controle.ok) && !(boite && boite.alerte),
    dernierControle: controle ? new Date(controle.date).toISOString() : null,
    surveillanceBoite: boite && boite.alerte ? "en panne" : "ok",
  };
}
