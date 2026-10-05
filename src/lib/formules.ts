// Formules d'abonnement affichées sur la page /tarifs/ (flyer « Nos formules »).
// Prix hors taxes. Modifier ici change la page Tarifs et les réponses de FAQ qui l'utilisent.

export const CREATION_SITE = 290;
export const PRIX_PAGE_SUP = 5;
export const ENGAGEMENT_MOIS = 24;
export const RASSURANCE = "14 jours pour changer d'avis, et aucun paiement avant.";

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

export const FORMULES: Formule[] = [
  {
    id: "essentiel",
    nom: "Essentiel",
    prix: 49,
    objectif: "Avoir enfin un site pro, sans se ruiner",
    ideal: "Artisan ou indépendant qui démarre",
    lignes: [
      { texte: "**1 à 3 pages** sur mesure", inclus: true },
      { texte: "Hébergement + nom de domaine", inclus: true },
      { texte: "Fiche Google **basique**", inclus: true },
      { texte: "**1** modification par mois", inclus: true },
      { texte: "Rapport de visites **annuel**", inclus: true },
      { texte: "Articles de blog", inclus: false },
      { texte: "Posts sur Google", inclus: false },
      { texte: "Avis Google affichés sur le site", inclus: false },
      { texte: "Refonte totale du site", inclus: false },
      { texte: "Suivi de mots-clés", inclus: false },
      { texte: "Pages dédiées par ville", inclus: false },
    ],
  },
  {
    id: "croissance",
    nom: "Croissance",
    prix: 89,
    objectif: "Être trouvé sur Google par vos futurs clients",
    ideal: "Commerce ou entreprise qui veut des clients près de chez elle",
    conseillee: true,
    lignes: [
      { texte: "**3 à 8 pages** sur mesure", inclus: true, nouveau: true },
      { texte: "Hébergement + nom de domaine", inclus: true },
      { texte: "Fiche Google **optimisée**", inclus: true, nouveau: true },
      { texte: "**3** modifications par mois", inclus: true, nouveau: true },
      { texte: "Rapport de visites **trimestriel**", inclus: true, nouveau: true },
      { texte: "**1** article de blog par mois", inclus: true, nouveau: true },
      { texte: "**2** posts Google par mois", inclus: true, nouveau: true },
      { texte: "**Avis Google** affichés", detail: "sur votre site", inclus: true, nouveau: true },
      { texte: "Refonte totale **tous les 3 ans**", inclus: true, nouveau: true },
      { texte: "Suivi de **5 mots-clés**", inclus: true, nouveau: true },
      { texte: "Pages dédiées par ville", inclus: false },
    ],
  },
  {
    id: "performance",
    nom: "Performance",
    prix: 149,
    objectif: "Remplir votre agenda grâce à Google",
    ideal: "Entreprise qui vise plusieurs villes",
    lignes: [
      { texte: "**15 pages** sur mesure", inclus: true, nouveau: true },
      { texte: "Hébergement + nom de domaine", inclus: true },
      { texte: "Fiche Google **experte**", inclus: true, nouveau: true },
      { texte: "**5** modifications par mois", inclus: true, nouveau: true },
      { texte: "Rapport de visites **mensuel**", inclus: true, nouveau: true },
      { texte: "**2** articles de blog par mois", inclus: true, nouveau: true },
      { texte: "**2** posts Google par mois", inclus: true },
      { texte: "**Avis Google** affichés", detail: "sur votre site", inclus: true },
      { texte: "Refonte totale **tous les 2 ans**", inclus: true, nouveau: true },
      { texte: "Suivi de **10 mots-clés**", inclus: true, nouveau: true },
      { texte: "Pages dédiées par ville", inclus: true, nouveau: true },
    ],
  },
];

/** « **gras** » -> <strong>gras</strong> (texte sûr : ne contient que nos propres données). */
export const enGras = (texte: string) => texte.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

export const euros = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ") + " €";
