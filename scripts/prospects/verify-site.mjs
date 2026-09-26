// Deuxième vérification "vraiment sans site" : Google Places n'affiche pas
// toujours le site d'une entreprise (champ jamais rempli sur sa fiche). On
// devine les domaines les plus probables à partir du nom (boulangerie-dupont.fr,
// boulangeriedupont.com…) et on ne considère un site trouvé que si la page
// contient le téléphone ou le code postal + la rue du prospect — un domaine
// parké ou homonyme ne suffit donc pas à écarter quelqu'un.
import { promises as dns } from "node:dns";

const GENERIC = new Set(["le", "la", "les", "l", "de", "du", "des", "d", "et", "a", "au", "aux", "en", "sur", "chez", "lyon", "sarl", "sas", "eurl"]);

function slugWords(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " et ")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function candidateDomains(name) {
  const words = slugWords(name.split(/[-–|,(]/)[0]); // avant un éventuel "- Lyon 3e | ..."
  const meaningful = words.filter((w) => !GENERIC.has(w));
  const bases = new Set();
  for (const ws of [words, meaningful]) {
    if (ws.length === 0 || ws.length > 5) continue;
    bases.add(ws.join("-"));
    bases.add(ws.join(""));
  }
  const out = [];
  for (const b of bases) {
    if (b.length < 4 || b.length > 40) continue;
    for (const tld of ["fr", "com"]) out.push(`${b}.${tld}`);
  }
  return out;
}

async function resolves(domain) {
  try { await dns.lookup(domain); return true; } catch { return false; }
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return "";
    return (await res.text()).slice(0, 400_000);
  } catch { return ""; } finally { clearTimeout(t); }
}

function matchesBusiness(html, { telephone, adresse }) {
  const digits = html.replace(/\D/g, "");
  const tel = (telephone ?? "").replace(/\D/g, "").slice(-9);
  if (tel.length === 9 && digits.includes(tel)) return true;
  const cp = adresse?.match(/\b69\d{3}\b/)?.[0];
  const street = adresse?.split(",")[0]?.replace(/^\d+\s*(bis|ter)?\s*/i, "").trim().toLowerCase();
  const text = html.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const streetN = street?.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return Boolean(cp && streetN && streetN.length > 5 && text.includes(cp) && text.includes(streetN));
}

// Renvoie l'URL du site trouvé, ou null si aucun site ne correspond au prospect.
export async function findHiddenSite(prospect) {
  for (const domain of candidateDomains(prospect.nom)) {
    if (!(await resolves(domain))) continue;
    for (const url of [`https://${domain}`, `https://www.${domain}`, `http://${domain}`]) {
      const html = await fetchText(url);
      if (html && matchesBusiness(html, prospect)) return url;
    }
  }
  return null;
}

// Vérifie une liste en parallèle limité ; renvoie un Set des index avec site.
export async function findHiddenSites(prospects, concurrency = 12) {
  const found = new Map();
  let i = 0;
  async function worker() {
    while (i < prospects.length) {
      const idx = i++;
      const url = await findHiddenSite(prospects[idx]);
      if (url) found.set(idx, url);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return found;
}
