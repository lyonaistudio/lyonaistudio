// Signale à IndexNow (Bing, Yandex, Seznam, Naver…) les articles publiés depuis moins de 2 jours.
// Lancé par le workflow après chaque déploiement, dont la reconstruction quotidienne de 6 h UTC
// qui publie les articles programmés. Seules les adresses déjà en ligne (réponse 200) sont envoyées.
// Google n'utilise pas IndexNow : pour lui, c'est le sitemap qui compte.
import { readdirSync, readFileSync } from "node:fs";

const SITE = "https://lyonaistudio.fr";
const CLE = "961f92bba957272fb352343b557f1bbf"; // fichier public/<clé>.txt
const DOSSIER = "src/content/blog";
const DEUX_JOURS = 2 * 86400000;

const maintenant = Date.now();
const nouveaux = [];
for (const fichier of readdirSync(DOSSIER).filter((f) => f.endsWith(".md"))) {
  const date = readFileSync(`${DOSSIER}/${fichier}`, "utf8").match(/^publishDate:\s*(\S+)/m)?.[1];
  const t = date ? Date.parse(date) : NaN;
  if (t <= maintenant && maintenant - t < DEUX_JOURS) nouveaux.push(`${SITE}/blog/${fichier.replace(/\.md$/, "")}/`);
}

const enLigne = [];
for (const url of nouveaux) {
  const r = await fetch(url, { method: "HEAD" }).catch(() => null);
  if (r && r.status === 200) enLigne.push(url);
  else console.log(`Pas encore en ligne, ignoré : ${url}`);
}
if (!enLigne.length) {
  console.log("Aucun nouvel article à signaler.");
} else {
  const urlList = [...enLigne, `${SITE}/blog/`];
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE).host, key: CLE, keyLocation: `${SITE}/${CLE}.txt`, urlList }),
  });
  console.log(`IndexNow : réponse ${r.status} pour ${urlList.length} adresse(s)`);
  for (const url of urlList) console.log(`  ${url}`);
}
