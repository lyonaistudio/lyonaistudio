export const SITE = {
  name: "Lyon AI Studio",
  url: "https://lyonaistudio.fr",
  email: "lyonaistudio@gmail.com",
  city: "Lyon",
  region: "Auvergne-Rhône-Alpes",
  country: "FR",
  hours: "Lundi – Vendredi, 9h – 18h",
  hoursSchema: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  // Fiche Google Business Profile (lien permanent par CID).
  googleBusinessUrl: "https://maps.google.com/?cid=14960039913131409264",
  // Lien direct vers le formulaire d'avis de la fiche Google.
  googleReviewUrl: "https://g.page/r/CXD_3A8KvZzPECE/review",
  // Profils officiels déclarés à Google (schema.org sameAs).
  sameAs: ["https://maps.google.com/?cid=14960039913131409264"] as string[],
  tagline: "Sites internet et automatisation IA pour les entreprises, partout en France",
  description:
    "Lyon AI Studio crée des sites internet et automatise les tâches répétitives (devis, relances, rendez-vous) des entreprises, commerces et indépendants, partout en France.",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/services/", label: "Services" },
  { href: "/a-propos/", label: "À propos" },
  { href: "/comment-ca-se-passe/", label: "Déroulement" },
  { href: "/blog/", label: "Actualités" },
  { href: "/faq/", label: "FAQ" },
  { href: "/contact/", label: "Contact" },
] as const;

// Informations légales de la société éditrice. Chaque champ vide est
// simplement masqué dans les mentions légales et les CGV : à compléter depuis
// le Kbis dès réception (SIRET, RCS, capital, siège, TVA) — obligatoire pour
// une SAS (LCEN art. 6-III). `directeurPublication` : un nom est exigé par la loi.
export const LEGAL = {
  denomination: "HVTB Company",
  forme: "société par actions simplifiée (SAS)",
  capital: "2 000 €",
  siege: "47 rue Vivienne, 75002 Paris",
  siret: "130 556 871 00015",
  rcs: "RCS Paris 130 556 871",
  tva: "", // n° de TVA intracommunautaire : à ajouter dès qu'il est actif (VIES)
  president: "Vivion",
  directeurPublication: "Batisse",
} as const;

export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgzeldk";
