// Formules d'abonnement affichées sur la page /tarifs/ et dans les FAQ.
// Les prix et le contenu viennent de src/data/formules.json, généré à partir de la
// liste de prix unique de Lyon AI Studio (outils internes, synchroniser.mjs) :
// ne pas modifier les prix ici. Montants hors taxes.
import data from "../data/formules.json";

export const CREATION_SITE: number = data.creation;
export const PRIX_PAGE_SUP: number = data.prixPageSup;
export const ENGAGEMENT_MOIS: number = data.engagementMois;
export const RASSURANCE: string = data.rassurance;

export type FormuleId = "essentiel" | "croissance" | "performance";

export interface Ligne {
  /** Texte de la ligne ; les parties entre ** ** sont mises en gras. */
  texte: string;
  /** Précision affichée en petit sous la ligne. */
  detail?: string;
  inclus: boolean;
  /** Ligne en plus par rapport à la formule précédente. */
  nouveau?: boolean;
}

export interface Formule {
  id: FormuleId;
  nom: string;
  prix: number;
  objectif: string;
  /** À qui s'adresse la formule. */
  ideal: string;
  conseillee?: boolean;
  lignes: Ligne[];
}

type Valeur = string | number;

/** Phrase d'un atout, identique dans le simulateur, l'Espace commercial et le flyer. */
function ligne(t: string, val: Valeur): Pick<Ligne, "texte" | "detail"> {
  const n = typeof val === "string" ? parseInt(val, 10) : 0;
  switch (t) {
    case "Pages sur mesure": return { texte: `**${val} pages** sur mesure` };
    case "Fiche Google": return { texte: `Fiche Google **${val}**` };
    case "Modifications par mois": return { texte: `**${val}** modification${n > 1 ? "s" : ""} par mois` };
    case "Rapport de visites": return { texte: `Rapport de visites **${val}**` };
    case "Articles de blog": return { texte: val ? `**${n}** article${n > 1 ? "s" : ""} de blog par mois` : "Articles de blog" };
    case "Posts sur Google": return { texte: val ? `**${n}** posts Google par mois` : "Posts sur Google" };
    case "Avis Google sur le site": return val ? { texte: "**Avis Google** affichés", detail: "sur votre site" } : { texte: "Avis Google affichés sur le site" };
    case "Refonte totale": return { texte: val ? `Refonte totale **${val}**` : "Refonte totale du site" };
    case "Suivi Google": return { texte: val ? `Suivi de **${val}**` : "Suivi de mots-clés" };
    case "Pages Google par ville": return { texte: "Pages dédiées par ville" };
    case "Automatisation IA": return val ? { texte: "**1 automatisation IA** offerte", detail: "rendez-vous, relance des devis ou assistant IA" } : { texte: "Automatisation IA offerte" };
    default: return { texte: t };
  }
}

export const FORMULES: Formule[] = data.formules.map((f, i) => ({
  id: f.slug as FormuleId,
  nom: f.nom,
  prix: f.prix,
  objectif: f.objectif,
  ideal: f.ideal,
  conseillee: "conseillee" in f ? Boolean(f.conseillee) : undefined,
  lignes: data.contenu.map((r) => {
    const val = r.v[i] as Valeur, avant = (i > 0 ? r.v[i - 1] : val) as Valeur;
    return { ...ligne(r.t, val), inclus: Boolean(val), nouveau: Boolean(val) && val !== avant };
  }),
}));

/** « **gras** » -> <strong>gras</strong> (texte sûr : ne contient que nos propres données). */
export const enGras = (texte: string) => texte.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

export const euros = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ") + " €";

// Automatisation seule (sans site) : payée uniquement chaque mois, sans frais de mise en service.
export interface Automatisation {
  id: string;
  nom: string;
  prix: number;
  desc: string;
}
export const AUTOMATISATIONS: Automatisation[] = data.automatisation.modules;
export const AUTO_ENGAGEMENT_MOIS: number = data.automatisation.engagementMois;
export const AUTO_REMISE = data.automatisation.remise as { des: number; taux: number };
export const AUTO_PRIX_MIN = Math.min(...AUTOMATISATIONS.map((a) => a.prix));

/** Mensualité d'un ensemble d'automatisations : remise dès AUTO_REMISE.des, arrondie à l'euro inférieur (comme sur le devis). */
export function mensualiteAuto(ids: string[]): number {
  const brut = AUTOMATISATIONS.filter((a) => ids.includes(a.id)).reduce((s, a) => s + a.prix, 0);
  return ids.length >= AUTO_REMISE.des ? Math.floor(brut * (1 - AUTO_REMISE.taux)) : brut;
}

/** Contenu des formules, ligne par ligne : une valeur par formule (0 = non compris, 1 = compris, texte = quantité). */
export const CONTENU = data.contenu as { t: string; v: (string | number)[] }[];
