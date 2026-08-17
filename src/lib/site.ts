export const SITE = {
  name: "Lyon AI Studio",
  url: "https://lyonaistudio.fr",
  email: "lyonaistudio@gmail.com",
  phone: "07 76 62 42 15",
  phoneHref: "+33776624215",
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
    "Lyon AI Studio conçoit des sites internet et met en place des agents IA et workflows d'automatisation pour les artisans, commerces et PME de la région lyonnaise.",
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

export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgzeldk";
