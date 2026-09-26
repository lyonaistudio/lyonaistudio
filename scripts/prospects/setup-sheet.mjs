// Mise en forme "CRM" du Sheet de prospection (onglets FRANCE, SUISSE,
// ESPAGNE + tableau de bord SUIVI). Idempotent : peut être relancé sans
// dupliquer règles, protections ni vues filtrées.
//
// - convertit les onglets encore à l'ancien format (9 colonnes) vers HEADERS
// - statut en menu déroulant + couleur de ligne par statut
// - dates (prise de contact / relance) avec calendrier, relance dépassée en rouge
// - commercial en menu déroulant (liste modifiable dans l'onglet SUIVI)
// - score en dégradé, colonnes du script protégées (avertissement), en-tête figé
// - vues filtrées personnelles + onglet SUIVI (formules)
//
// Usage : node scripts/prospects/setup-sheet.mjs

import { loadServiceAccount, getAccessToken } from "./google-auth.mjs";
import {
  HEADERS, COL, NB_COLS, SCRIPT_COLS, STATUTS, STATUTS_CLOS, DASHBOARD_TAB,
  SCORE_HEADER_FORMULA, SCORE_NOTE, prospectRow,
} from "./sheet-layout.mjs";

const SHEET_ID = "1_pSfsW5Kdw1qU__TJ9CUlFQaetp6pfXFYODHEv5TKcA";
const TABS = ["FRANCE", "SUISSE", "ESPAGNE"];
const OLD_HEADERS = ["Date", "Entreprise", "Categorie", "Adresse", "Telephone", "status", "prise de contact", "Présence web", "Famille"];
const MARK = "[crm]"; // repère nos protections / vues pour pouvoir les remplacer

const sa = loadServiceAccount("/home/thomasbatpro/lyon ia studio /cle api/lyon-ai-studio-prospection-9345a0c6de0b.json");
const token = await getAccessToken(sa);
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const api = (path, init) => fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, { headers: H, ...init });
async function batch(requests) {
  if (!requests.length) return;
  const res = await api(":batchUpdate", { method: "POST", body: JSON.stringify({ requests }) });
  if (!res.ok) throw new Error(`batchUpdate ${res.status}: ${await res.text()}`);
}
const getValues = async (range) => (await (await api(`/values/${encodeURIComponent(range)}`)).json()).values ?? [];
const putValues = async (range, values) => {
  const res = await api(`/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, { method: "PUT", body: JSON.stringify({ values }) });
  if (!res.ok) throw new Error(`PUT ${range} ${res.status}: ${await res.text()}`);
};
const rgb = (hex) => ({ red: parseInt(hex.slice(1, 3), 16) / 255, green: parseInt(hex.slice(3, 5), 16) / 255, blue: parseInt(hex.slice(5, 7), 16) / 255 });
const L = (i) => String.fromCharCode(65 + i); // index de colonne → lettre

// ---- 0. Onglet SUIVI (créé d'abord : les menus "Commercial" pointent dessus) ----
let meta = await (await api("?fields=sheets(properties,protectedRanges,conditionalFormats,filterViews,basicFilter)")).json();
if (!meta.sheets.some((s) => s.properties.title === DASHBOARD_TAB)) {
  await batch([{ addSheet: { properties: { title: DASHBOARD_TAB, index: 0, tabColorStyle: { rgbColor: rgb("#e6003a") } } } }]);
  meta = await (await api("?fields=sheets(properties,protectedRanges,conditionalFormats,filterViews,basicFilter)")).json();
}
const sheetOf = (title) => meta.sheets.find((s) => s.properties.title === title);

// Liste de l'équipe commerciale : SUIVI!B4:B9 (modifiable à la main).
const TEAM_RANGE = `${DASHBOARD_TAB}!$B$4:$B$9`;
const team = await getValues(`${DASHBOARD_TAB}!B4:B9`);
const teamNames = team.flat().filter(Boolean).length ? team.flat() : ["Commercial 1", "Commercial 2"];

// ---- 1. Conversion des données à l'ancien format ----
for (const tab of TABS) {
  const values = await getValues(`${tab}!A1:Z`);
  const header = values[0] ?? [];
  if (header.join("|") === HEADERS.join("|")) { console.log(`${tab} : déjà au nouveau format`); continue; }
  if (header.slice(0, 9).join("|") !== OLD_HEADERS.join("|")) throw new Error(`${tab} : en-tête inattendu, conversion annulée → ${header.join(" | ")}`);
  const rows = values.slice(1).filter((r) => r[1]).map((r) => {
    const row = prospectRow({
      date: r[0], nom: r[1], famille: r[8] ?? "", categorie: r[2], adresse: r[3], telephone: r[4],
      presence: r[7] || "À vérifier",
    });
    row[COL["Statut"]] = STATUTS.find((s) => s.toLowerCase() === (r[5] ?? "").toLowerCase()) ?? "Nouveau";
    row[COL["Prise de contact"]] = r[6] ?? "";
    return row;
  });
  const sh = sheetOf(tab);
  await batch([
    ...(sh.basicFilter ? [{ clearBasicFilter: { sheetId: sh.properties.sheetId } }] : []),
    { updateCells: { range: { sheetId: sh.properties.sheetId }, fields: "userEnteredValue,userEnteredFormat,note,dataValidation" } },
  ]);
  await putValues(`${tab}!A1:${L(NB_COLS - 1)}${rows.length + 1}`, [HEADERS, ...rows]);
  console.log(`${tab} : ${rows.length} lignes converties`);
}

// ---- 2. Mise en forme de chaque onglet pays ----
// Lignes vides pré-formatées sous le tableau : les prospects ajoutés chaque
// jour (append) y atterrissent et héritent des menus, couleurs et filtres.
const GRID_ROWS = 20000;
meta = await (await api("?fields=sheets(properties)")).json();
await batch(meta.sheets
  .filter((s) => TABS.includes(s.properties.title) && s.properties.gridProperties.rowCount < GRID_ROWS)
  .map((s) => ({ appendDimension: { sheetId: s.properties.sheetId, dimension: "ROWS", length: GRID_ROWS - s.properties.gridProperties.rowCount } })));
meta = await (await api("?fields=sheets(properties,protectedRanges,conditionalFormats,filterViews,basicFilter)")).json();
const STATUT_COLORS = {
  "À rappeler": "#fff4c2", "Pas de réponse": "#fde2c8", "Intéressé": "#d9f2d9", "RDV pris": "#b9e6c3",
  "Devis envoyé": "#c9e2ff", "Signé": "#8fd19e", "Pas intéressé": "#e3e3e3", "Hors cible": "#e3e3e3",
};
const WIDTHS = [90, 260, 170, 140, 280, 120, 150, 90, 60, 65, 105, 130, 130, 120, 125, 260];

for (const tab of TABS) {
  const sh = sheetOf(tab);
  const id = sh.properties.sheetId;
  const rowCount = sh.properties.gridProperties.rowCount;
  const req = [];

  // Nettoyage de nos anciennes règles / protections / vues (idempotence).
  for (let i = (sh.conditionalFormats ?? []).length - 1; i >= 0; i--) req.push({ deleteConditionalFormatRule: { sheetId: id, index: i } });
  for (const p of sh.protectedRanges ?? []) if (p.description?.includes(MARK)) req.push({ deleteProtectedRange: { protectedRangeId: p.protectedRangeId } });
  for (const v of sh.filterViews ?? []) if (v.title?.includes("·")) req.push({ deleteFilterView: { filterId: v.filterViewId } });

  // Taille de grille : 16 colonnes exactement.
  const cols = sh.properties.gridProperties.columnCount;
  if (cols > NB_COLS) req.push({ deleteDimension: { range: { sheetId: id, dimension: "COLUMNS", startIndex: NB_COLS, endIndex: cols } } });
  if (cols < NB_COLS) req.push({ appendDimension: { sheetId: id, dimension: "COLUMNS", length: NB_COLS - cols } });

  // En-tête : fond sombre, texte blanc gras, figé avec l'entreprise.
  req.push({ repeatCell: {
    range: { sheetId: id, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: NB_COLS },
    cell: { userEnteredFormat: { backgroundColor: rgb("#1f1f1f"), textFormat: { bold: true, foregroundColor: rgb("#ffffff") }, verticalAlignment: "MIDDLE", wrapStrategy: "WRAP" } },
    fields: "userEnteredFormat(backgroundColor,textFormat,verticalAlignment,wrapStrategy)",
  } });
  req.push({ updateSheetProperties: { properties: { sheetId: id, gridProperties: { frozenRowCount: 1, frozenColumnCount: 2 } }, fields: "gridProperties.frozenRowCount,gridProperties.frozenColumnCount" } });
  req.push({ updateDimensionProperties: { range: { sheetId: id, dimension: "ROWS", startIndex: 0, endIndex: 1 }, properties: { pixelSize: 36 }, fields: "pixelSize" } });
  WIDTHS.forEach((w, i) => req.push({ updateDimensionProperties: { range: { sheetId: id, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 }, properties: { pixelSize: w }, fields: "pixelSize" } }));

  // Corps : texte noir, alignement vertical, dates au format jj/mm/aaaa.
  const body = (c0, c1) => ({ sheetId: id, startRowIndex: 1, endRowIndex: rowCount, startColumnIndex: c0, endColumnIndex: c1 });
  req.push({ repeatCell: { range: body(0, NB_COLS), cell: { userEnteredFormat: { textFormat: { foregroundColor: rgb("#000000") }, verticalAlignment: "MIDDLE" } }, fields: "userEnteredFormat(textFormat.foregroundColor,verticalAlignment)" } });
  for (const c of [COL["Date"], COL["Prise de contact"], COL["Prochaine relance"]]) {
    req.push({ repeatCell: { range: body(c, c + 1), cell: { userEnteredFormat: { numberFormat: { type: "DATE", pattern: "dd/mm/yyyy" }, horizontalAlignment: "CENTER" } }, fields: "userEnteredFormat(numberFormat,horizontalAlignment)" } });
  }
  for (const c of [COL["Note Google"], COL["Avis"], COL["Score"]]) {
    req.push({ repeatCell: { range: body(c, c + 1), cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } }, fields: "userEnteredFormat.horizontalAlignment" } });
  }
  req.push({ repeatCell: { range: body(COL["Score"], COL["Score"] + 1), cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat.bold" } });
  req.push({ repeatCell: { range: body(COL["Notes"], COL["Notes"] + 1), cell: { userEnteredFormat: { wrapStrategy: "CLIP" } }, fields: "userEnteredFormat.wrapStrategy" } });

  // Menus déroulants et calendriers.
  req.push({ setDataValidation: { range: body(COL["Statut"], COL["Statut"] + 1), rule: {
    condition: { type: "ONE_OF_LIST", values: STATUTS.map((v) => ({ userEnteredValue: v })) }, strict: true, showCustomUi: true } } });
  req.push({ setDataValidation: { range: body(COL["Commercial"], COL["Commercial"] + 1), rule: {
    condition: { type: "ONE_OF_RANGE", values: [{ userEnteredValue: `=${TEAM_RANGE}` }] }, strict: false, showCustomUi: true } } });
  for (const c of [COL["Prise de contact"], COL["Prochaine relance"]]) {
    req.push({ setDataValidation: { range: body(c, c + 1), rule: { condition: { type: "DATE_IS_VALID" }, strict: true, inputMessage: "Double-clic pour ouvrir le calendrier" } } });
  }

  // Couleur de ligne selon le statut (la 1re règle qui s'applique gagne).
  const S = L(COL["Statut"]), R = L(COL["Prochaine relance"]);
  const rules = [];
  // Relance dépassée (dossier encore ouvert) : case relance en rouge.
  rules.push({ ranges: [body(COL["Prochaine relance"], COL["Prochaine relance"] + 1)], booleanRule: {
    condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: `=AND($${R}2<>"";$${R}2<TODAY();ISNA(MATCH($${S}2;{"${STATUTS_CLOS.join('";"')}"};0)))` }] },
    format: { backgroundColor: rgb("#e6003a"), textFormat: { bold: true, foregroundColor: rgb("#ffffff") } } } });
  // Relance aujourd'hui : orange.
  rules.push({ ranges: [body(COL["Prochaine relance"], COL["Prochaine relance"] + 1)], booleanRule: {
    condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: `=$${R}2=TODAY()` }] },
    format: { backgroundColor: rgb("#ff9f1c"), textFormat: { bold: true } } } });
  for (const [statut, color] of Object.entries(STATUT_COLORS)) {
    rules.push({ ranges: [body(0, NB_COLS)], booleanRule: {
      condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: `=$${S}2="${statut}"` }] },
      format: { backgroundColor: rgb(color), ...(STATUTS_CLOS.slice(1).includes(statut) ? { textFormat: { foregroundColor: rgb("#777777") } } : {}) } } });
  }
  // Score : dégradé blanc → vert.
  rules.push({ ranges: [body(COL["Score"], COL["Score"] + 1)], gradientRule: {
    minpoint: { color: rgb("#ffffff"), type: "NUMBER", value: "30" },
    maxpoint: { color: rgb("#57bb8a"), type: "NUMBER", value: "90" } } });
  rules.forEach((rule, index) => req.push({ addConditionalFormatRule: { rule, index } }));

  // Colonnes du script protégées : simple avertissement (le compte de
  // service doit pouvoir continuer à écrire, et personne n'est bloqué).
  req.push({ addProtectedRange: { protectedRange: {
    range: { sheetId: id, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: SCRIPT_COLS },
    description: `${MARK} Données remplies automatiquement par la recherche de prospects`, warningOnly: true } } });
  req.push({ addProtectedRange: { protectedRange: {
    range: { sheetId: id, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: NB_COLS },
    description: `${MARK} En-tête`, warningOnly: true } } });

  // Filtre partagé sur tout le tableau.
  req.push({ setBasicFilter: { filter: { range: { sheetId: id, startRowIndex: 0, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: NB_COLS } } } });

  // Vues filtrées personnelles (ne gênent pas les autres utilisateurs).
  const all = { sheetId: id, startRowIndex: 0, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: NB_COLS };
  const custom = (formula) => ({ condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: formula }] } });
  const views = [
    { title: "1 · À appeler en priorité", filterSpecs: [{ columnIndex: COL["Statut"], filterCriteria: custom(`=${S}2="Nouveau"`) }],
      sortSpecs: [{ dimensionIndex: COL["Score"], sortOrder: "DESCENDING" }] },
    { title: "2 · Relances du jour et en retard", filterSpecs: [{ columnIndex: COL["Prochaine relance"], filterCriteria: custom(`=AND(${R}2<>"";${R}2<=TODAY();ISNA(MATCH(${S}2;{"${STATUTS_CLOS.join('";"')}"};0)))`) }],
      sortSpecs: [{ dimensionIndex: COL["Prochaine relance"], sortOrder: "ASCENDING" }] },
    { title: "3 · Pipeline chaud", filterSpecs: [{ columnIndex: COL["Statut"], filterCriteria: custom(`=OR(${S}2="Intéressé";${S}2="RDV pris";${S}2="Devis envoyé")`) }],
      sortSpecs: [{ dimensionIndex: COL["Prochaine relance"], sortOrder: "ASCENDING" }] },
    { title: "4 · Aucun site, bien notés", filterSpecs: [
        { columnIndex: COL["Présence web"], filterCriteria: { condition: { type: "TEXT_EQ", values: [{ userEnteredValue: "Aucun site" }] } } },
        { columnIndex: COL["Statut"], filterCriteria: custom(`=${S}2="Nouveau"`) }],
      sortSpecs: [{ dimensionIndex: COL["Score"], sortOrder: "DESCENDING" }] },
    ...teamNames.filter(Boolean).map((name, i) => ({
      title: `${5 + i} · ${name} — mes dossiers en cours`,
      filterSpecs: [
        { columnIndex: COL["Commercial"], filterCriteria: { condition: { type: "TEXT_EQ", values: [{ userEnteredValue: name }] } } },
        { columnIndex: COL["Statut"], filterCriteria: custom(`=ISNA(MATCH(${S}2;{"${STATUTS_CLOS.join('";"')}"};0))`) }],
      sortSpecs: [{ dimensionIndex: COL["Prochaine relance"], sortOrder: "ASCENDING" }] })),
  ];
  for (const v of views) req.push({ addFilterView: { filter: { ...v, range: all } } });

  await batch(req);
  await putValues(`${tab}!${L(COL["Score"])}1`, [[SCORE_HEADER_FORMULA]]);
  await batch([{ updateCells: { range: { sheetId: id, startRowIndex: 0, endRowIndex: 1, startColumnIndex: COL["Score"], endColumnIndex: COL["Score"] + 1 },
    rows: [{ values: [{ note: SCORE_NOTE }] }], fields: "note" } }]);
  console.log(`${tab} : mise en forme OK (${views.length} vues filtrées)`);
}

// ---- 3. Tableau de bord SUIVI ----
const dash = sheetOf(DASHBOARD_TAB);
const dashId = dash.properties.sheetId;
const c = (tab, col) => `${tab}!$${L(COL[col])}$2:$${L(COL[col])}`;
const ouverts = (tab) => STATUTS_CLOS.map((s) => `(${c(tab, "Statut")}<>"${s}")`).join("*");
const sumTabs = (fn) => TABS.map(fn).join("+");
const HOT = ["Intéressé", "RDV pris", "Devis envoyé"];

const grid = [];
const put = (r, col, v) => { (grid[r] ??= [])[col] = v; };
put(0, 0, "TABLEAU DE BORD — PROSPECTION");
put(1, 0, `=CONCATENATE("Mis à jour en continu · ";TEXT(NOW();"dd/mm/yyyy hh:mm"))`);

put(2, 1, "ÉQUIPE COMMERCIALE (modifiable)");
teamNames.concat(Array(6).fill("")).slice(0, 6).forEach((n, i) => put(3 + i, 1, n));
put(2, 3, "À FAIRE AUJOURD'HUI");
put(3, 3, "Relances en retard"); put(3, 4, `=${sumTabs((t) => `SUMPRODUCT((${c(t, "Prochaine relance")}<>"")*(${c(t, "Prochaine relance")}<TODAY())*${ouverts(t)})`)}`);
put(4, 3, "Relances aujourd'hui"); put(4, 4, `=${sumTabs((t) => `COUNTIF(${c(t, "Prochaine relance")};TODAY())`)}`);
put(5, 3, "Nouveaux prioritaires à appeler (score ≥ 55)"); put(5, 4, `=${sumTabs((t) => `COUNTIFS(${c(t, "Statut")};"Nouveau";${c(t, "Score")};">=55")`)}`);
put(6, 3, "Dossiers chauds"); put(6, 4, `=${sumTabs((t) => HOT.map((h) => `COUNTIF(${c(t, "Statut")};"${h}")`).join("+"))}`);

let r = 10;
put(r, 0, "PAR PAYS");
const statCols = ["Prospects", ...STATUTS, "Taux de contact", "Taux de signature"];
statCols.forEach((h, i) => put(r + 1, 1 + i, h));
[...TABS, "TOTAL"].forEach((tab, j) => {
  const row = r + 2 + j;
  put(row, 0, tab);
  if (tab === "TOTAL") {
    statCols.slice(0, 1 + STATUTS.length).forEach((_, i) => put(row, 1 + i, `=SUM(${L(1 + i)}${r + 3}:${L(1 + i)}${r + 2 + TABS.length})`));
  } else {
    put(row, 1, `=COUNTA(${c(tab, "Entreprise")})`);
    STATUTS.forEach((s, i) => put(row, 2 + i, `=COUNTIF(${c(tab, "Statut")};"${s}")`));
  }
  const tot = `B${row + 1}`, nouv = `C${row + 1}`, signe = `${L(2 + STATUTS.indexOf("Signé"))}${row + 1}`;
  put(row, 1 + STATUTS.length + 1, `=IFERROR((${tot}-${nouv})/${tot};0)`);
  put(row, 1 + STATUTS.length + 2, `=IFERROR(${signe}/(${tot}-${nouv});0)`);
});
const paysEnd = r + 2 + TABS.length + 1; // + ligne TOTAL

r = paysEnd + 1;
put(r, 0, "PAR COMMERCIAL");
const comCols = ["Dossiers", "Appelés", "Chauds", "Signés", "Relances en retard", "Taux de signature"];
comCols.forEach((h, i) => put(r + 1, 1 + i, h));
teamNames.forEach((_, k) => {
  const row = r + 2 + k;
  const who = `$B$${4 + k}`;
  put(row, 0, `=B${4 + k}`);
  put(row, 1, `=${sumTabs((t) => `COUNTIF(${c(t, "Commercial")};${who})`)}`);
  put(row, 2, `=${sumTabs((t) => `COUNTIFS(${c(t, "Commercial")};${who};${c(t, "Statut")};"<>Nouveau")`)}`);
  put(row, 3, `=${sumTabs((t) => HOT.map((h) => `COUNTIFS(${c(t, "Commercial")};${who};${c(t, "Statut")};"${h}")`).join("+"))}`);
  put(row, 4, `=${sumTabs((t) => `COUNTIFS(${c(t, "Commercial")};${who};${c(t, "Statut")};"Signé")`)}`);
  put(row, 5, `=${sumTabs((t) => `SUMPRODUCT((${c(t, "Commercial")}=${who})*(${c(t, "Prochaine relance")}<>"")*(${c(t, "Prochaine relance")}<TODAY())*${ouverts(t)})`)}`);
  put(row, 6, `=IFERROR(E${row + 1}/C${row + 1};0)`);
});
const comEnd = r + 2 + teamNames.length;

r = comEnd + 2;
put(r, 0, "PAR FAMILLE (quelles niches répondent le mieux)");
const famCols = ["Prospects", "Appelés", "Chauds", "Signés", "Taux d'intérêt", "Taux de signature"];
famCols.forEach((h, i) => put(r + 1, 1 + i, h));
const familles = ["Alimentation & restauration", "Beauté & bien-être", "Bâtiment & travaux", "Santé", "Services", "Auto & transport", "Commerce", "Professions libérales & immobilier"];
familles.forEach((f, k) => {
  const row = r + 2 + k;
  put(row, 0, f);
  put(row, 1, `=${sumTabs((t) => `COUNTIF(${c(t, "Famille")};$A${row + 1})`)}`);
  put(row, 2, `=${sumTabs((t) => `COUNTIFS(${c(t, "Famille")};$A${row + 1};${c(t, "Statut")};"<>Nouveau")`)}`);
  put(row, 3, `=${sumTabs((t) => HOT.map((h) => `COUNTIFS(${c(t, "Famille")};$A${row + 1};${c(t, "Statut")};"${h}")`).join("+"))}`);
  put(row, 4, `=${sumTabs((t) => `COUNTIFS(${c(t, "Famille")};$A${row + 1};${c(t, "Statut")};"Signé")`)}`);
  put(row, 5, `=IFERROR((D${row + 1}+E${row + 1})/C${row + 1};0)`);
  put(row, 6, `=IFERROR(E${row + 1}/C${row + 1};0)`);
});
const famEnd = r + 2 + familles.length;

// Écriture : on vide l'onglet puis on pose les formules.
await batch([{ updateCells: { range: { sheetId: dashId }, fields: "userEnteredValue,userEnteredFormat" } }]);
const width = Math.max(...Array.from(grid, (row) => row?.length ?? 0)); // Array.from : les lignes vides (trous) comptent pour 0
const dashValues = Array.from({ length: grid.length }, (_, r) => Array.from({ length: width }, (_, i) => grid[r]?.[i] ?? ""));
await putValues(`${DASHBOARD_TAB}!A1:${L(width - 1)}${grid.length}`, dashValues);

// Mise en forme du tableau de bord.
const box = (r0, r1, c0, c1) => ({ sheetId: dashId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c0, endColumnIndex: c1 });
const fmt = (range, userEnteredFormat, fields) => ({ repeatCell: { range, cell: { userEnteredFormat }, fields } });
const title = { textFormat: { bold: true, fontSize: 11, foregroundColor: rgb("#e6003a") } };
const head = { backgroundColor: rgb("#1f1f1f"), textFormat: { bold: true, foregroundColor: rgb("#ffffff") }, horizontalAlignment: "CENTER", wrapStrategy: "WRAP", verticalAlignment: "MIDDLE" };
const pct = { numberFormat: { type: "PERCENT", pattern: "0%" } };
const dreq = [
  { updateSheetProperties: { properties: { sheetId: dashId, gridProperties: { frozenRowCount: 2, hideGridlines: true } }, fields: "gridProperties.frozenRowCount,gridProperties.hideGridlines" } },
  { updateDimensionProperties: { range: { sheetId: dashId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 }, properties: { pixelSize: 260 }, fields: "pixelSize" } },
  { updateDimensionProperties: { range: { sheetId: dashId, dimension: "COLUMNS", startIndex: 1, endIndex: 14 }, properties: { pixelSize: 105 }, fields: "pixelSize" } },
  { updateDimensionProperties: { range: { sheetId: dashId, dimension: "COLUMNS", startIndex: 1, endIndex: 2 }, properties: { pixelSize: 180 }, fields: "pixelSize" } },
  { updateDimensionProperties: { range: { sheetId: dashId, dimension: "COLUMNS", startIndex: 3, endIndex: 4 }, properties: { pixelSize: 230 }, fields: "pixelSize" } },
  fmt(box(0, 1, 0, 1), { textFormat: { bold: true, fontSize: 16 } }, "userEnteredFormat.textFormat"),
  fmt(box(1, 2, 0, 1), { textFormat: { italic: true, foregroundColor: rgb("#777777") } }, "userEnteredFormat.textFormat"),
  // Équipe
  fmt(box(2, 3, 1, 2), title, "userEnteredFormat.textFormat"),
  fmt(box(3, 9, 1, 2), { backgroundColor: rgb("#fff8e1"), borders: {} }, "userEnteredFormat.backgroundColor"),
  // À faire aujourd'hui
  fmt(box(2, 3, 3, 4), title, "userEnteredFormat.textFormat"),
  fmt(box(3, 7, 4, 5), { textFormat: { bold: true, fontSize: 14 }, horizontalAlignment: "CENTER" }, "userEnteredFormat(textFormat,horizontalAlignment)"),
  // Titres de sections
  ...[10, paysEnd + 1, comEnd + 2].map((row) => fmt(box(row, row + 1, 0, 1), title, "userEnteredFormat.textFormat")),
  // En-têtes de tableaux
  fmt(box(11, 12, 1, 1 + statCols.length), head, "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy,verticalAlignment)"),
  fmt(box(paysEnd + 2, paysEnd + 3, 1, 1 + comCols.length), head, "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy,verticalAlignment)"),
  fmt(box(comEnd + 3, comEnd + 4, 1, 1 + famCols.length), head, "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy,verticalAlignment)"),
  // Corps de tableaux centrés, ligne TOTAL en gras
  fmt(box(12, paysEnd, 1, 1 + statCols.length), { horizontalAlignment: "CENTER" }, "userEnteredFormat.horizontalAlignment"),
  fmt(box(paysEnd - 1, paysEnd, 0, 1 + statCols.length), { textFormat: { bold: true }, backgroundColor: rgb("#f1f1f1") }, "userEnteredFormat(textFormat,backgroundColor)"),
  fmt(box(paysEnd + 3, comEnd, 1, 1 + comCols.length), { horizontalAlignment: "CENTER" }, "userEnteredFormat.horizontalAlignment"),
  fmt(box(comEnd + 4, famEnd, 1, 1 + famCols.length), { horizontalAlignment: "CENTER" }, "userEnteredFormat.horizontalAlignment"),
  fmt(box(12, paysEnd, statCols.length - 1, 1 + statCols.length), pct, "userEnteredFormat.numberFormat"),
  fmt(box(paysEnd + 3, comEnd, comCols.length, 1 + comCols.length), pct, "userEnteredFormat.numberFormat"),
  fmt(box(comEnd + 4, famEnd, famCols.length - 1, 1 + famCols.length), pct, "userEnteredFormat.numberFormat"),
];
await batch(dreq);
console.log(`${DASHBOARD_TAB} : tableau de bord OK`);
