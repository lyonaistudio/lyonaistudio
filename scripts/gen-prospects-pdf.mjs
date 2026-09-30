import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = "/home/thomasbatpro/lyon ia studio /";
const CSV_PATH = ROOT + "sheet /prospects-nouveaux.csv";
const OUT_PATH = process.argv[2] || ROOT + "sheet /prospects-lyon-ai-studio.pdf";

const INK = "#121110";
const PAPER = "#f4f1ea";
const PAPER_DIM = "#d9d4c8";
const MIST = "#93897a";
const ACCENT = "#e2672c";
const INK_LINE = "#2b2721";
const INK_SOFT = "#1a1815";

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(";");
  return lines.slice(1).map((line) => {
    const cells = line.split(";");
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

const rows = parseCsv(readFileSync(CSV_PATH, "utf-8"));

const byCategory = {};
for (const r of rows) {
  const cat = r["Categorie"];
  (byCategory[cat] ??= []).push(r);
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const sections = Object.entries(byCategory)
  .map(
    ([cat, items]) => `
    <section class="cat">
      <h2>${esc(cat)} <span class="count">${items.length}</span></h2>
      <table>
        <thead>
          <tr><th>Entreprise</th><th>Adresse</th><th>Téléphone</th><th>Présence web</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (r) => `
            <tr>
              <td class="name">${esc(r["Nom"])}</td>
              <td class="addr">${esc(r["Adresse"])}</td>
              <td class="phone">${esc(r["Telephone"] || "—")}</td>
              <td class="site note">${esc(r["Note"] || "")}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </section>`
  )
  .join("");

const html = `
<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Helvetica Neue", Arial, sans-serif;
    background: ${PAPER};
    color: ${INK};
  }
  .cover {
    background: ${INK};
    color: ${PAPER};
    padding: 60px 50px 50px;
    position: relative;
  }
  .cover::after {
    content: "";
    position: absolute; left: 50px; right: 50px; bottom: 0;
    height: 3px; background: ${ACCENT};
  }
  .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 40px; }
  .mark {
    width: 34px; height: 34px; border: 2px solid ${ACCENT}; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 18px; color: ${ACCENT};
  }
  .brand-name { font-weight: 700; font-size: 18px; }
  h1 { font-size: 30px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.01em; }
  .sub { color: ${PAPER_DIM}; font-size: 14px; margin: 0 0 30px; }
  .stats { display: flex; gap: 40px; margin-top: 10px; }
  .stat-num { font-size: 32px; font-weight: 700; color: ${ACCENT}; }
  .stat-label { font-size: 11px; color: ${MIST}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }

  .content { padding: 30px 50px 50px; }
  .cat { margin-bottom: 26px; }
  .cat h2 {
    font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;
    color: ${ACCENT}; border-bottom: 1px solid ${INK_LINE}; padding-bottom: 8px;
    margin: 0 0 10px; display: flex; align-items: baseline; gap: 8px;
  }
  .cat h2 .count { color: ${MIST}; font-weight: 400; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th {
    text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em;
    color: ${MIST}; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid ${INK_LINE};
  }
  td { padding: 7px 8px; border-bottom: 1px solid #e5e0d5; vertical-align: top; }
  tr:nth-child(even) td { background: ${PAPER_DIM}22; }
  .name { font-weight: 600; width: 22%; }
  .addr { color: #4a453d; width: 34%; }
  .phone { font-family: "Courier New", monospace; width: 14%; }
  .site { width: 30%; }
  .note { color: ${ACCENT}; font-style: italic; }

  footer {
    padding: 20px 50px; border-top: 1px solid ${INK_LINE}; background: ${INK_SOFT};
    color: ${MIST}; font-size: 9px; display: flex; justify-content: space-between;
  }
</style>
</head>
<body>
  <div class="cover">
    <div class="brand">
      <div class="mark">L</div>
      <div class="brand-name">Lyon AI Studio</div>
    </div>
    <h1>Liste de prospection</h1>
    <p class="sub">Généré le ${today} — entreprises lyonnaises sans site professionnel, cibles idéales pour une offre de création de site.</p>
    <div class="stats">
      <div><div class="stat-num">${rows.length}</div><div class="stat-label">Prospects</div></div>
      <div><div class="stat-num">${Object.keys(byCategory).length}</div><div class="stat-label">Métiers</div></div>
      <div><div class="stat-num">Lyon</div><div class="stat-label">Zone</div></div>
    </div>
  </div>
  <div class="content">
    ${sections}
  </div>
  <footer>
    <span>Lyon AI Studio — lyonaistudio@gmail.com</span>
    <span>lyonaistudio.fr</span>
  </footer>
</body>
</html>
`;

writeFileSync("/tmp/prospects-preview.html", html);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file:///tmp/prospects-preview.html`, { waitUntil: "networkidle" });
await page.pdf({
  path: OUT_PATH,
  format: "A4",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();
console.log("PDF written to", OUT_PATH);
