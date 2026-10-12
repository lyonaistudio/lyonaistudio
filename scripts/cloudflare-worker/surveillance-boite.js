// Surveillance de la boîte contact@lyonaistudio.fr : à chaque nouvel e-mail reçu,
// une alerte Telegram (expéditeur + objet). Lancée par la tâche planifiée du Worker.
// Lecture seule en IMAP : les messages ne sont jamais marqués comme lus ni modifiés.
// Inactive tant que le secret OVH_SMTP_PASSWORD (mot de passe de contact@) n'est pas défini.
// Le dernier message vu est retenu dans le KV ETAT, pour n'alerter qu'une fois par message.
import { connect } from "cloudflare:sockets";

const BOITE = "contact@lyonaistudio.fr";
const MAX_ALERTES = 10;

// Octets <-> chaîne « binaire » (1 caractère = 1 octet), pour compter les littéraux IMAP en octets
const enBinaire = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode(...u8.subarray(i, i + 8192)); return s; };
const versUtf8 = (bin) => new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
const citer = (s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';

class Imap {
  constructor(env) {
    const tls = env.IMAP_TLS !== "off";
    this.socket = connect({ hostname: env.IMAP_HOST || "imap.mail.ovh.net", port: Number(env.IMAP_PORT) || 993 }, { secureTransport: tls ? "on" : "off" });
    this.lecteur = this.socket.readable.getReader();
    this.ecrivain = this.socket.writable.getWriter();
    this.tampon = "";
    this.n = 0;
  }
  async lireJusqua(fin) {
    const limite = Date.now() + 20000;
    while (!fin(this.tampon)) {
      if (Date.now() > limite) throw new Error("IMAP : délai dépassé");
      const { value, done } = await this.lecteur.read();
      if (done) throw new Error("IMAP : connexion fermée");
      this.tampon += enBinaire(value);
    }
  }
  async accueil() {
    await this.lireJusqua((t) => t.includes("\r\n"));
    if (!/^\* (OK|PREAUTH)/.test(this.tampon)) throw new Error("IMAP : accueil inattendu");
    this.tampon = "";
  }
  async commande(texte) {
    const tag = "a" + ++this.n;
    await this.ecrivain.write(new TextEncoder().encode(`${tag} ${texte}\r\n`));
    const re = new RegExp(`(^|\\r\\n)${tag} (OK|NO|BAD)[^\\r\\n]*\\r\\n`);
    await this.lireJusqua((t) => re.test(t));
    const m = this.tampon.match(re);
    const reponse = this.tampon.slice(0, m.index + m[0].length);
    this.tampon = this.tampon.slice(m.index + m[0].length);
    if (m[2] !== "OK") throw new Error(`IMAP : ${texte.split(" ")[0]} refusé`);
    return reponse;
  }
  async fermer() {
    try { await this.ecrivain.write(new TextEncoder().encode(`a${++this.n} LOGOUT\r\n`)); } catch {}
    try { await this.socket.close(); } catch {}
  }
}

// Décode les en-têtes MIME (=?UTF-8?B?...?= / =?UTF-8?Q?...?=)
function decoderEntete(s) {
  return s.replace(/\r\n[ \t]+/g, " ").replace(/=\?([^?]+)\?([bqBQ])\?([^?]*)\?=(\s+(?==\?))?/g, (_, cs, enc, txt) => {
    try {
      let octets;
      if (enc.toUpperCase() === "B") octets = Uint8Array.from(atob(txt), (c) => c.charCodeAt(0));
      else octets = Uint8Array.from(txt.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))), (c) => c.charCodeAt(0));
      return new TextDecoder(cs.toLowerCase()).decode(octets);
    } catch { return txt; }
  }).trim();
}

// Extrait UID + en-têtes de chaque réponse FETCH
function lireMessages(reponse) {
  const out = [];
  const re = /\* \d+ FETCH \(([^{]*)\{(\d+)\}\r\n/g;
  let m;
  while ((m = re.exec(reponse))) {
    const uid = Number((m[1].match(/UID (\d+)/) || [])[1]);
    const brut = versUtf8(reponse.substr(m.index + m[0].length, Number(m[2])));
    const champ = (nom) => { const x = brut.match(new RegExp(`^${nom}:([^\\r\\n]*(?:\\r\\n[ \\t][^\\r\\n]*)*)`, "im")); return x ? decoderEntete(x[1]) : ""; };
    if (uid) out.push({ uid, de: champ("From"), objet: champ("Subject") });
  }
  return out;
}

export async function surveillerBoite(env, alerter) {
  if (!env.OVH_SMTP_PASSWORD || !env.ETAT) return { actif: false };
  const imap = new Imap(env);
  try {
    await imap.accueil();
    await imap.commande(`LOGIN ${citer(BOITE)} ${citer(env.OVH_SMTP_PASSWORD)}`);
    const sel = await imap.commande("EXAMINE INBOX"); // lecture seule
    const validite = (sel.match(/UIDVALIDITY (\d+)/) || [])[1] || "0";
    const suivant = Number((sel.match(/UIDNEXT (\d+)/) || [])[1] || 0);
    const etat = JSON.parse((await env.ETAT.get("boite-contact")) || "null");

    // Premier passage (ou boîte réinitialisée) : on mémorise la position sans alerter sur l'existant
    if (!etat || etat.validite !== validite) {
      await env.ETAT.put("boite-contact", JSON.stringify({ validite, dernier: Math.max(0, suivant - 1) }));
      return { actif: true, initialise: true };
    }
    if (suivant && suivant - 1 <= etat.dernier) return { actif: true, nouveaux: 0 };

    const rep = await imap.commande(`UID FETCH ${etat.dernier + 1}:* (UID BODY.PEEK[HEADER.FIELDS (FROM SUBJECT)])`);
    const nouveaux = lireMessages(rep).filter((x) => x.uid > etat.dernier).sort((a, b) => a.uid - b.uid);
    if (!nouveaux.length) return { actif: true, nouveaux: 0 };

    const montres = nouveaux.slice(-MAX_ALERTES);
    for (const x of montres) {
      await alerter(`📩 Nouvel e-mail sur ${BOITE}\nDe : ${x.de || "?"}\nObjet : ${x.objet || "(sans objet)"}`.slice(0, 1000));
    }
    if (nouveaux.length > montres.length) await alerter(`📩 … et ${nouveaux.length - montres.length} autre(s) e-mail(s) sur ${BOITE}.`);
    await env.ETAT.put("boite-contact", JSON.stringify({ validite, dernier: nouveaux[nouveaux.length - 1].uid }));
    return { actif: true, nouveaux: nouveaux.length };
  } finally {
    await imap.fermer();
  }
}
