// Recherche hebdomadaire de prospects (entreprises lyonnaises sans site pro)
// + génération d'un PDF prêt à envoyer au commercial. Ne dépend d'aucune
// connexion OAuth (contrairement au scénario Make) — juste la clé API
// Google Places, déjà en place et fonctionnelle.
//
// Usage : node fetch-and-generate.mjs
// Sortie : commercial/prospects-lyon-ai-studio.pdf (+ .csv en support)

import { chromium } from "playwright";
import { writeFileSync, readFileSync } from "node:fs";

const ROOT = "/home/thomasbatpro/lyon ia studio /";
const GKEY = readFileSync(ROOT + "cle api/cleapigoogle.txt", "utf-8").trim();
const OUT_DIR = ROOT + "commercial/";
const CSV_PATH = OUT_DIR + "prospects-lyon-ai-studio.csv";
const PDF_PATH = OUT_DIR + "prospects-lyon-ai-studio.pdf";

// Les 32 métiers déjà utilisés dans le scénario Make "Integration HTTP" —
// on les interroge tous à chaque run hebdomadaire pour un maximum de volume.
const METIERS = [
  "coiffeur", "plombier", "boulangerie", "restaurant", "fleuriste", "electricien",
  "opticien", "boucherie", "patisserie", "menuisier", "peintre en batiment",
  "serrurier", "garage automobile", "institut de beaute", "salon de tatouage",
  "cordonnerie", "pressing", "traiteur", "fromagerie", "cave a vin", "animalerie",
  "bijouterie", "horlogerie", "librairie", "magasin de sport", "cabinet dentaire",
  "cabinet d architecte", "agence immobiliere", "avocat", "kinesitherapeute",
  "coach sportif", "institut de bien-etre",
];

const SOCIAL_ONLY = ["facebook.com", "instagram.com", "linktr.ee", "linkedin.com", "planity.com", "treatwell"];

async function searchPlaces(query) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GKEY,
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber",
    },
    body: JSON.stringify({ textQuery: `${query} Lyon` }),
  });
  if (!res.ok) {
    console.error(`Erreur recherche "${query}":`, res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return data.places ?? [];
}

console.log(`Recherche sur ${METIERS.length} métiers...`);
const seen = new Set();
const rows = [];

for (const metier of METIERS) {
  const places = await searchPlaces(metier);
  for (const p of places) {
    const name = p.displayName?.text ?? "";
    const address = p.formattedAddress ?? "";
    const key = `${name}|${address}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const site = p.websiteUri ?? "";
    const hasRealSite = site && !SOCIAL_ONLY.some((s) => site.toLowerCase().includes(s));
    if (hasRealSite) continue; // on ne garde que ceux SANS vrai site pro

    rows.push({
      categorie: `${metier} Lyon`,
      nom: name,
      adresse: address,
      telephone: p.nationalPhoneNumber ?? "—",
      note: site ? "Page Facebook/Instagram uniquement" : "Aucun site",
    });
  }
}

console.log(`${rows.length} prospects sans vrai site trouvés.`);

const csvLines = ["Categorie;Nom;Adresse;Telephone;Note"];
for (const r of rows) csvLines.push(`${r.categorie};${r.nom};${r.adresse};${r.telephone};${r.note}`);
writeFileSync(CSV_PATH, csvLines.join("\n"), "utf-8");

// ---- PDF ----
const INK = "#121110", PAPER = "#f4f1ea", PAPER_DIM = "#d9d4c8", MIST = "#93897a", ACCENT = "#e2672c", INK_LINE = "#2b2721", INK_SOFT = "#1a1815";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const byCategory = {};
for (const r of rows) (byCategory[r.categorie] ??= []).push(r);

const sections = Object.entries(byCategory)
  .map(
    ([cat, items]) => `
    <section class="cat">
      <h2>${esc(cat)} <span class="count">${items.length}</span></h2>
      <table>
        <thead><tr><th>Entreprise</th><th>Adresse</th><th>Téléphone</th><th>Présence web</th></tr></thead>
        <tbody>
          ${items.map((r) => `
            <tr>
              <td class="name">${esc(r.nom)}</td>
              <td class="addr">${esc(r.adresse)}</td>
              <td class="phone">${esc(r.telephone)}</td>
              <td class="note">${esc(r.note)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </section>`
  )
  .join("");

const html = `
<!doctype html><html lang="fr"><head><meta charset="UTF-8"><style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Helvetica Neue", Arial, sans-serif; background: ${PAPER}; color: ${INK}; }
  .cover { background: ${INK}; color: ${PAPER}; padding: 60px 50px 50px; position: relative; }
  .cover::after { content: ""; position: absolute; left: 50px; right: 50px; bottom: 0; height: 3px; background: ${ACCENT}; }
  .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 40px; }
  .mark { width: 34px; height: 34px; border: 2px solid ${ACCENT}; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: ${ACCENT}; }
  .brand-name { font-weight: 700; font-size: 18px; }
  h1 { font-size: 30px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.01em; }
  .sub { color: ${PAPER_DIM}; font-size: 14px; margin: 0 0 30px; }
  .stats { display: flex; gap: 40px; margin-top: 10px; }
  .stat-num { font-size: 32px; font-weight: 700; color: ${ACCENT}; }
  .stat-label { font-size: 11px; color: ${MIST}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
  .content { padding: 30px 50px 50px; }
  .cat { margin-bottom: 26px; }
  .cat h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: ${ACCENT}; border-bottom: 1px solid ${INK_LINE}; padding-bottom: 8px; margin: 0 0 10px; display: flex; align-items: baseline; gap: 8px; }
  .cat h2 .count { color: ${MIST}; font-weight: 400; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: ${MIST}; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid ${INK_LINE}; }
  td { padding: 7px 8px; border-bottom: 1px solid #e5e0d5; vertical-align: top; }
  tr:nth-child(even) td { background: ${PAPER_DIM}22; }
  .name { font-weight: 600; width: 24%; }
  .addr { color: #4a453d; width: 36%; }
  .phone { font-family: "Courier New", monospace; width: 16%; }
  .note { color: ${ACCENT}; font-style: italic; width: 24%; }
  footer { padding: 20px 50px; border-top: 1px solid ${INK_LINE}; background: ${INK_SOFT}; color: ${MIST}; font-size: 9px; display: flex; justify-content: space-between; }
</style></head><body>
  <div class="cover">
    <div class="brand"><div class="mark">L</div><div class="brand-name">Lyon AI Studio</div></div>
    <h1>Liste de prospection</h1>
    <p class="sub">Généré le ${today} — entreprises lyonnaises sans site professionnel, cibles idéales pour une offre de création de site.</p>
    <div class="stats">
      <div><div class="stat-num">${rows.length}</div><div class="stat-label">Prospects</div></div>
      <div><div class="stat-num">${Object.keys(byCategory).length}</div><div class="stat-label">Métiers</div></div>
      <div><div class="stat-num">Lyon</div><div class="stat-label">Zone</div></div>
    </div>
  </div>
  <div class="content">${sections}</div>
  <footer><span>Lyon AI Studio — lyonaistudio@gmail.com</span><span>lyonaistudio.fr</span></footer>
</body></html>`;

const tmpHtml = "/tmp/prospects-render.html";
writeFileSync(tmpHtml, html, "utf-8");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${tmpHtml}`, { waitUntil: "networkidle" });
await page.pdf({ path: PDF_PATH, format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();

console.log("PDF écrit dans", PDF_PATH);
