// Recherche quotidienne de prospects (entreprises lyonnaises sans site pro)
// + génération d'un PDF prêt à envoyer au commercial. Ne dépend d'aucune
// connexion OAuth (contrairement au scénario Make) — juste la clé API
// Google Places, déjà en place et fonctionnelle.
//
// Usage : node fetch-and-generate.mjs
// Sortie : commercial/prospects-lyon-ai-studio.pdf (+ .csv en support)

import { chromium } from "playwright";
import { writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { loadServiceAccount, getAccessToken } from "./google-auth.mjs";
import { findHiddenSites } from "./verify-site.mjs";

const ROOT = "/home/thomasbatpro/lyon ia studio /";
const GKEY = readFileSync(ROOT + "cle api/cleapigoogle.txt", "utf-8").trim();
const OUT_DIR = ROOT + "commercial/";
const REGION_ARG = process.argv.find((a) => a.startsWith("--region="))?.split("=")[1] ?? "france";
const REGION_SUFFIX = REGION_ARG === "france" ? "" : `-${REGION_ARG}`;
const CSV_PATH = OUT_DIR + `prospects-lyon-ai-studio${REGION_SUFFIX}.csv`;
const PDF_PATH = OUT_DIR + `prospects-lyon-ai-studio${REGION_SUFFIX}.pdf`;
const SHEET_ID = "1_pSfsW5Kdw1qU__TJ9CUlFQaetp6pfXFYODHEv5TKcA";

const METIERS = [
  "coiffeur", "barbier", "plombier", "chauffagiste", "boulangerie", "restaurant", "pizzeria",
  "salon de the", "fleuriste", "electricien", "opticien", "boucherie", "patisserie", "menuisier",
  "peintre en batiment", "couvreur", "carreleur", "macon", "plaquiste", "paysagiste", "vitrier",
  "serrurier", "garage automobile", "carrosserie", "auto-ecole", "institut de beaute",
  "salon de tatouage", "onglerie", "cordonnerie", "retoucherie", "pressing", "traiteur",
  "fromagerie", "epicerie fine", "cave a vin", "animalerie", "toiletteur", "bijouterie",
  "horlogerie", "librairie", "magasin de sport", "reparation telephone", "demenageur",
  "photographe", "cabinet dentaire", "osteopathe", "podologue", "kinesitherapeute",
  "cabinet d architecte", "agence immobiliere", "avocat", "coach sportif", "institut de bien-etre",
  "nettoyage entreprise",
];

// `--region=suisse` : même recherche en Suisse romande, ajoutée au même Sheet
// (onglet SUISSE) (fichiers PDF/CSV et curseur de rotation séparés).
const REGION = process.argv.find((a) => a.startsWith("--region="))?.split("=")[1] ?? "france";
const REGIONS = {
  france: {
    label: "Lyon",
    suffix: "",
    // Lyon intra-muros par arrondissement + communes de la Métropole : une même
    // recherche "plombier Lyon" ne renvoie que 20 résultats (toujours les mêmes),
    // alors que "plombier Lyon 7e" ou "plombier Villeurbanne" en fait remonter d'autres.
    zones: [
      "Lyon 1er", "Lyon 2e", "Lyon 3e", "Lyon 4e", "Lyon 5e", "Lyon 6e", "Lyon 7e", "Lyon 8e", "Lyon 9e",
      "Villeurbanne", "Venissieux", "Caluire-et-Cuire", "Bron", "Vaulx-en-Velin", "Saint-Priest",
      "Oullins", "Tassin-la-Demi-Lune", "Ecully", "Rillieux-la-Pape", "Decines-Charpieu", "Meyzieu",
      "Sainte-Foy-les-Lyon", "Saint-Fons", "Champagne-au-Mont-d-Or",
    ],
    sheetTab: "FRANCE",
    regionCode: "FR",
    // Code postal du Rhône : Google élargit parfois la zone (Isère, Mâcon…).
    inArea: (address) => /\b69\d{3}\b/.test(address),
    tlds: ["fr", "com"],
    textColor: { red: 0, green: 0, blue: 0 },
  },
  suisse: {
    label: "Suisse romande",
    suffix: "-suisse",
    zones: [
      "Geneve", "Carouge GE", "Vernier", "Lancy", "Meyrin", "Lausanne", "Renens VD", "Morges",
      "Nyon", "Vevey", "Montreux", "Yverdon-les-Bains", "Fribourg", "Bulle", "Neuchatel",
      "La Chaux-de-Fonds", "Sion", "Sierre", "Martigny", "Monthey", "Delemont",
    ],
    sheetTab: "SUISSE",
    regionCode: "CH",
    // Avec regionCode CH, Google omet le pays : NPA suisse à 4 chiffres, pas d'adresse française.
    inArea: (address) => /\b[1-9]\d{3}\s+\p{L}/u.test(address) && !/France|\b\d{5}\b/.test(address),
    tlds: ["ch", "com"],
    textColor: { red: 0, green: 0, blue: 0 },
  },
  espagne: {
    label: "Espagne",
    suffix: "-espagne",
    // Grandes villes ; Madrid et Barcelone découpées par quartier pour ne pas
    // plafonner à 20 résultats par recherche.
    zones: [
      "Madrid Centro", "Madrid Salamanca", "Madrid Chamberi", "Madrid Retiro", "Madrid Tetuan",
      "Barcelona Eixample", "Barcelona Gracia", "Barcelona Sants", "Barcelona Sant Marti",
      "Valencia", "Sevilla", "Zaragoza", "Malaga", "Bilbao", "Alicante", "Murcia",
      "Palma de Mallorca", "Granada", "Cordoba", "Valladolid", "Vigo", "A Coruna",
      "San Sebastian", "Pamplona",
    ],
    sheetTab: "ESPAGNE",
    regionCode: "ES",
    languageCode: "es",
    inArea: (address) => /\b\d{5}\b/.test(address) && !/(France|Portugal|Andorra|M[ée]xico|CDMX|Argentina|Colombia|Chile|Per[úu]|Venezuela|Ecuador|Guatemala|Puerto Rico|United States|USA)\s*$/i.test(address), // pays en fin d'adresse (pas un nom de rue)
    tlds: ["es", "com"],
    textColor: { red: 0, green: 0, blue: 0 },
    // Recherche en espagnol ; la catégorie écrite dans le Sheet reste en français.
    queryTerm: {
      "coiffeur": "peluqueria", "barbier": "barberia", "plombier": "fontanero", "chauffagiste": "calefaccion instalador",
      "boulangerie": "panaderia", "restaurant": "restaurante", "pizzeria": "pizzeria", "salon de the": "cafeteria",
      "fleuriste": "floristeria", "electricien": "electricista", "opticien": "optica", "boucherie": "carniceria",
      "patisserie": "pasteleria", "menuisier": "carpinteria", "peintre en batiment": "pintor de casas",
      "couvreur": "tejados reparacion", "carreleur": "alicatador", "macon": "albanil", "plaquiste": "pladur instalador",
      "paysagiste": "jardineria paisajismo", "vitrier": "cristaleria", "serrurier": "cerrajero",
      "garage automobile": "taller mecanico", "carrosserie": "chapa y pintura", "auto-ecole": "autoescuela",
      "institut de beaute": "centro de estetica", "salon de tatouage": "estudio de tatuajes", "onglerie": "salon de unas",
      "cordonnerie": "zapateria reparacion", "retoucherie": "arreglos de ropa", "pressing": "tintoreria",
      "traiteur": "catering", "fromagerie": "queseria", "epicerie fine": "tienda gourmet", "cave a vin": "vinoteca",
      "animalerie": "tienda de animales", "toiletteur": "peluqueria canina", "bijouterie": "joyeria",
      "horlogerie": "relojeria", "librairie": "libreria", "magasin de sport": "tienda de deportes",
      "reparation telephone": "reparacion de moviles", "demenageur": "mudanzas", "photographe": "fotografo",
      "cabinet dentaire": "clinica dental", "osteopathe": "osteopata", "podologue": "podologo",
      "kinesitherapeute": "fisioterapeuta", "cabinet d architecte": "estudio de arquitectura",
      "agence immobiliere": "inmobiliaria", "avocat": "abogado", "coach sportif": "entrenador personal",
      "institut de bien-etre": "centro de masajes", "nettoyage entreprise": "empresa de limpieza",
    },
  },
};
const R = REGIONS[REGION];
if (!R) throw new Error(`Région inconnue : ${REGION} (${Object.keys(REGIONS).join(" | ")})`);
const ZONES = R.zones;
const SHEET_TAB = R.sheetTab;

// Rotation : chaque lot = BATCH_SIZE couples (métier, zone) pris à la suite
// dans la grille complète, en reprenant là où le run précédent s'est arrêté
// (curseur sur disque). Le volume de requêtes Google par jour reste celui
// d'avant (32), mais chaque jour explore des combinaisons nouvelles au lieu de
// répéter les mêmes 32 recherches. `--lots=N` pour en faire plusieurs d'un coup.
const BATCH_SIZE = 32;
const CURSOR_PATH = new URL(`./cursor${R.suffix}.json`, import.meta.url);
const COMBOS = ZONES.flatMap((zone) => METIERS.map((metier) => ({ metier, zone })));
const lots = Number(process.argv.find((a) => a.startsWith("--lots="))?.split("=")[1] ?? 1);
let cursor = 0;
try { cursor = JSON.parse(readFileSync(CURSOR_PATH, "utf-8")).cursor ?? 0; } catch {}
const todo = Array.from({ length: BATCH_SIZE * lots }, (_, i) => COMBOS[(cursor + i) % COMBOS.length]);
const nextCursor = (cursor + todo.length) % COMBOS.length;

// Liens qui ne sont pas un site à eux : réseaux sociaux, plateformes de
// réservation/livraison et annuaires. Un prospect qui n'a que ça reste un prospect.
const NOT_A_REAL_SITE = {
  "facebook.com": "Facebook", "instagram.com": "Instagram", "tiktok.com": "TikTok",
  "linktr.ee": "Linktree", "linkedin.com": "LinkedIn", "wa.me": "WhatsApp",
  "planity.com": "Planity", "treatwell": "Treatwell", "doctolib.fr": "Doctolib",
  "kiute.com": "Kiute", "booksy.com": "Booksy", "pagesjaunes.fr": "PagesJaunes",
  "ubereats.com": "Uber Eats", "deliveroo.fr": "Deliveroo", "thefork": "TheFork",
  "lafourchette": "TheFork", "business.site": "ancien site Google (fermé)",
  "g.page": "fiche Google", "google.com": "fiche Google",
};
Object.assign(NOT_A_REAL_SITE, {
  "eltenedor": "TheFork", "glovoapp": "Glovo", "just-eat": "Just Eat", "justeat": "Just Eat",
  "paginasamarillas": "Páginas Amarillas", "doctoralia": "Doctoralia", "top-doctors": "Top Doctors",
});
const platformOf = (url) => Object.entries(NOT_A_REAL_SITE).find(([d]) => url.toLowerCase().includes(d))?.[1];

async function searchPlaces(query) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GKEY,
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.businessStatus",
    },
    body: JSON.stringify({ textQuery: query, regionCode: R.regionCode, languageCode: R.languageCode ?? "fr" }),
  });
  if (!res.ok) {
    console.error(`Erreur recherche "${query}":`, res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return data.places ?? [];
}

console.log(`Recherche : ${todo.length} combinaisons métier × zone (position ${cursor}/${COMBOS.length})...`);
const seen = new Set();
const rows = [];

for (const { metier, zone } of todo) {
  const places = await searchPlaces(`${R.queryTerm?.[metier] ?? metier} ${zone}`);
  for (const p of places) {
    const name = p.displayName?.text ?? "";
    const address = p.formattedAddress ?? "";
    const key = `${name}|${address}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (!R.inArea(address)) continue; // hors zone (Google élargit parfois la recherche)
    if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue; // fermé (temporairement ou définitivement)

    const site = p.websiteUri ?? "";
    const platform = site ? platformOf(site) : undefined;
    if (site && !platform) continue; // on ne garde que ceux SANS vrai site pro

    rows.push({
      categorie: metier, // la niche seule (filtrable) ; la ville est dans l'adresse
      zone,
      nom: name,
      adresse: address,
      telephone: p.nationalPhoneNumber ?? "—",
      note: platform ? `${platform} uniquement` : "Aucun site",
    });
  }
}

console.log(`${rows.length} prospects sans site selon Google, vérification des sites non déclarés...`);
const hidden = await findHiddenSites(rows, { tlds: R.tlds });
for (const idx of [...hidden.keys()].sort((a, b) => b - a)) rows.splice(idx, 1);
console.log(`${hidden.size} avaient en fait un site (écartés) → ${rows.length} prospects vraiment sans site.`);

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
      <div><div class="stat-num">${esc(R.label)}</div><div class="stat-label">Zone</div></div>
    </div>
  </div>
  <div class="content">${sections}</div>
  <footer><span>Lyon AI Studio — lyonaistudio@gmail.com</span><span>lyonaistudio.fr</span></footer>
</body></html>`;

const tmpHtml = "/tmp/prospects-render.html";
writeFileSync(tmpHtml, html, "utf-8");

// Le cache ~/.cache/ms-playwright peut contenir une révision de navigateur
// différente de celle attendue par ce paquet playwright (cache partagé avec
// d'autres outils, nettoyages disque) : on retombe alors sur celle présente.
function findCachedHeadlessShell() {
  const cache = `${homedir()}/.cache/ms-playwright`;
  if (!existsSync(cache)) return undefined;
  const dirs = readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort().reverse();
  for (const d of dirs) {
    const bin = `${cache}/${d}/chrome-headless-shell-linux64/chrome-headless-shell`;
    if (existsSync(bin)) return bin;
  }
  return undefined;
}
const defaultPath = chromium.executablePath();
const browser = await chromium.launch(
  existsSync(defaultPath) ? {} : { executablePath: findCachedHeadlessShell() }
);
const page = await browser.newPage();
await page.goto(`file://${tmpHtml}`, { waitUntil: "networkidle" });
await page.pdf({ path: PDF_PATH, format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await browser.close();

console.log("PDF écrit dans", PDF_PATH);

// ---- Ecriture dans le Google Sheet (compte de service, pas de scénario Make) ----
const sa = loadServiceAccount(ROOT + "cle api/lyon-ai-studio-prospection-9345a0c6de0b.json");
const token = await getAccessToken(sa);

const existingRes = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}!B:D`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const existing = (await existingRes.json()).values ?? [];
const existingKeys = new Set(existing.slice(1).map((r) => `${r[0] ?? ""}|${r[2] ?? ""}`));

const todayIso = new Date().toLocaleDateString("fr-FR");
const newRows = rows
  .filter((r) => !existingKeys.has(`${r.nom}|${r.adresse}`))
  .map((r) => [todayIso, r.nom, r.categorie, r.adresse, r.telephone, "nouveau", "", r.note]);

if (newRows.length > 0) {
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}!A1:append?valueInputOption=RAW`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: newRows }),
    }
  );
  if (!appendRes.ok) {
    console.error("Erreur écriture Sheet:", appendRes.status, await appendRes.text());
  } else {
    console.log(`${newRows.length} nouveaux prospects ajoutés au Sheet.`);
    if (R.textColor) await colorAppendedRows(token, (await appendRes.json()).updates?.updatedRange, R.textColor);
    await extendBasicFilter(token);
  }
} else {
  console.log("Aucun nouveau prospect à ajouter au Sheet (déjà présents).");
}

writeFileSync(CURSOR_PATH, JSON.stringify({ cursor: nextCursor, updated: new Date().toISOString() }) + "\n");

// Met en couleur (police) les lignes que l'append vient d'écrire — noir
// explicite, pour ne jamais hériter d'une mise en forme laissée dans l'onglet.
async function colorAppendedRows(token, updatedRange, color) {
  const m = updatedRange?.match(/!A(\d+):[A-Z]+(\d+)$/);
  if (!m) return console.error("Plage ajoutée introuvable, pas de mise en couleur :", updatedRange);
  const meta = await (await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` } }
  )).json();
  const sheetId = meta.sheets.find((sh) => sh.properties.title === SHEET_TAB).properties.sheetId;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ repeatCell: {
      range: { sheetId, startRowIndex: Number(m[1]) - 1, endRowIndex: Number(m[2]), startColumnIndex: 0, endColumnIndex: 8 },
      cell: { userEnteredFormat: { textFormat: { foregroundColor: color } } },
      fields: "userEnteredFormat.textFormat.foregroundColor",
    } }] }),
  });
  if (!res.ok) console.error("Erreur mise en couleur:", res.status, await res.text());
}

// Le filtre de l'onglet (menu sur "Categorie" pour choisir une niche) a une
// plage figée : on la réétend jusqu'à la dernière ligne après chaque ajout, en
// gardant les critères éventuellement cochés.
async function extendBasicFilter(token) {
  const meta = await (await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets(properties(sheetId,title,gridProperties.rowCount),basicFilter)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )).json();
  const sh = meta.sheets.find((x) => x.properties.title === SHEET_TAB);
  const filter = sh.basicFilter ?? {};
  filter.range = { sheetId: sh.properties.sheetId, startRowIndex: 0, endRowIndex: sh.properties.gridProperties.rowCount, startColumnIndex: 0, endColumnIndex: 8 };
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ setBasicFilter: { filter } }] }),
  });
  if (!res.ok) console.error("Erreur extension du filtre:", res.status, await res.text());
}
