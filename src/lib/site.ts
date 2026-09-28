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
  sameAs: [] as string[],
  tagline: "Sites internet et automatisation IA pour les entreprises locales",
  description:
    "Lyon AI Studio crée des sites internet et automatise les tâches répétitives (devis, relances, rendez-vous) des artisans, commerces et PME, à Lyon et partout en France.",
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
  capital: "", // ex. "1 000 €"
  siege: "", // adresse complète du siège social
  siret: "",
  rcs: "", // ex. "RCS Lyon 123 456 789"
  tva: "", // n° de TVA intracommunautaire
  directeurPublication: "", // nom du président (le nom de famille suffit)
} as const;

export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgzeldk";
