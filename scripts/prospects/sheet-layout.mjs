// Mise en page "CRM" du Sheet de prospection, partagée entre le script
// quotidien (fetch-and-generate.mjs) et la mise en forme des onglets
// (setup-sheet.mjs). Colonnes A→P :
export const HEADERS = [
  "Date", "Entreprise", "Famille", "Catégorie", "Adresse", "Téléphone", "Présence web",
  "Note Google", "Avis", "Score", "Fiche Google", "Commercial", "Statut",
  "Prise de contact", "Prochaine relance", "Notes",
];
export const COL = Object.fromEntries(HEADERS.map((h, i) => [h, i]));
export const NB_COLS = HEADERS.length;
export const SCRIPT_COLS = COL["Fiche Google"] + 1; // A→K remplies par le script

export const STATUTS = [
  "Nouveau", "À rappeler", "Pas de réponse", "Intéressé", "RDV pris",
  "Devis envoyé", "Signé", "Pas intéressé", "Hors cible",
];
export const STATUTS_CLOS = ["Signé", "Pas intéressé", "Hors cible"];
export const DASHBOARD_TAB = "SUIVI";

// Texte écrit en USER_ENTERED (pour les dates et formules) : on neutralise
// tout ce qui pourrait être interprété comme formule ou comme nombre
// (un téléphone sans espaces perdrait son 0 initial).
export function safeText(v) {
  const s = String(v ?? "");
  return /^[=+\-@]/.test(s) || /^\d+$/.test(s) ? `'${s}` : s;
}

export function mapsCell(url, nom, adresse) {
  const u = url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nom}, ${adresse}`)}`;
  return `=HYPERLINK("${u.replace(/"/g, "%22")}";"Voir la fiche")`;
}

// Une ligne du Sheet ; la colonne Score reste vide (null) : elle est
// calculée pour toute la colonne par la formule de l'en-tête.
export function prospectRow({ date, nom, famille, categorie, adresse, telephone, presence, note, avis, mapsUrl }) {
  return [
    date, safeText(nom), famille, categorie, safeText(adresse), safeText(telephone), presence,
    typeof note === "number" ? note : "", typeof avis === "number" ? avis : "", null,
    mapsCell(mapsUrl, nom, adresse), "", "Nouveau", "", "", "",
  ];
}

// Score de priorité (0–100) : pas de site, joignable, commerce actif et bien noté.
export const SCORE_HEADER_FORMULA =
  '={"Score";ARRAYFORMULA(IF(B2:B="";"";ROUND(' +
  'IF(G2:G="Aucun site";40;IF(REGEXMATCH(G2:G;"Facebook|Instagram|TikTok|Linktree|WhatsApp|LinkedIn|À vérifier");30;20))' +
  '+IF((F2:F<>"")*(F2:F<>"—");15;0)' +
  '+IF(ISNUMBER(I2:I);IF(I2:I>200;200;I2:I)/200*30;0)' +
  '+IF(ISNUMBER(H2:H)*(N(+I2:I)>=5);IF(H2:H>=4,5;15;IF(H2:H>=4;10;0));0)' + // note comptée à partir de 5 avis
  ';0)))}';

export const SCORE_NOTE = `Score de priorité (0 à 100) — plus il est haut, plus le prospect vaut l'appel.

• Présence web : aucun site = 40 pts · seulement Facebook/Instagram… = 30 · seulement Doctolib/Planity… = 20
• Téléphone disponible = 15 pts
• Nombre d'avis Google (commerce actif, avec des clients) = jusqu'à 30 pts (200 avis ou plus)
• Note Google (à partir de 5 avis) : ≥ 4,5★ = 15 pts · ≥ 4★ = 10 pts

Repères : 70+ = à appeler en premier · 55–70 = bon prospect · < 55 = peu d'infos ou moins prioritaire.`;
