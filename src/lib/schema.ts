import { SITE } from "./site";

const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;
const BUSINESS_ID = `${SITE.url}/#business`;

const LOGO = {
  "@type": "ImageObject",
  url: `${SITE.url}/logo-1200.png`,
  width: 1200,
  height: 1200,
};

// Services proposés, repris dans le catalogue du LocalBusiness et dans le
// schéma Service de chaque page de service.
export const SERVICES = [
  { name: "Création de site internet", path: "/services/creation-site-internet/" },
  { name: "Automatisation et agent IA", path: "/services/automatisation-ia/" },
  { name: "Référencement local / SEO", path: "/services/referencement-local-seo/" },
  { name: "UX / UI Design", path: "/services/ux-ui-design/" },
  { name: "Maintenance et hébergement de site web", path: "/services/maintenance-hebergement/" },
] as const;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    url: SITE.url,
    logo: LOGO,
    image: `${SITE.url}/og-image.png`,
    email: SITE.email,
    description: SITE.description,
    slogan: SITE.tagline,
    areaServed: { "@type": "Country", name: "France" },
    knowsAbout: [
      "Création de site internet",
      "Site vitrine",
      "Référencement naturel (SEO)",
      "Référencement local",
      "Google Business Profile",
      "Automatisation des tâches",
      "Agents IA",
      "UX / UI Design",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: SITE.email,
      areaServed: "FR",
      availableLanguage: ["French"],
    },
    sameAs: SITE.sameAs,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    url: SITE.url,
    inLanguage: "fr-FR",
    publisher: { "@id": ORG_ID },
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": BUSINESS_ID,
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    email: SITE.email,
    priceRange: "€€",
    parentOrganization: { "@id": ORG_ID },
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: SITE.country,
    },
    // Toute la France (travail à distance) ; Lyon reste la ville du siège.
    areaServed: [
      { "@type": "Country", name: "France" },
      { "@type": "City", name: "Lyon" },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: SERVICES.map((service) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.name, url: `${SITE.url}${service.path}` },
      })),
    },
    logo: LOGO,
    image: `${SITE.url}/og-image.png`,
    hasMap: SITE.googleBusinessUrl,
    openingHoursSpecification: SITE.hoursSchema,
    sameAs: SITE.sameAs,
  };
}

export function serviceSchema(options: { name: string; description: string; path: string; serviceType: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE.url}${options.path}#service`,
    name: options.name,
    description: options.description,
    serviceType: options.serviceType,
    url: `${SITE.url}${options.path}`,
    provider: { "@id": BUSINESS_ID },
    areaServed: { "@type": "Country", name: "France" },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${SITE.url}/contact/`,
    },
  };
}

export function blogSchema(posts: { title: string; description: string; slug: string; publishDate: Date; updatedDate?: Date }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE.url}/blog/#blog`,
    name: `Actualités — ${SITE.name}`,
    url: `${SITE.url}/blog/`,
    inLanguage: "fr-FR",
    publisher: { "@id": ORG_ID },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url: `${SITE.url}/blog/${post.slug}/`,
      datePublished: post.publishDate.toISOString(),
      dateModified: (post.updatedDate ?? post.publishDate).toISOString(),
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE.url}${item.url}`,
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        // Answers may contain inline links (<a href="…">) for on-page internal
        // linking — stripped here so the JSON-LD text stays plain, matching
        // what a screen reader or rich-result snippet would read aloud.
        text: item.answer.replace(/<[^>]+>/g, ""),
      },
    })),
  };
}

export function articleSchema(options: {
  title: string;
  description: string;
  slug: string;
  publishDate: Date;
  updatedDate?: Date;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: options.title,
    description: options.description,
    image: {
      "@type": "ImageObject",
      url: `${SITE.url}${options.image}`,
      width: 1200,
      height: 675,
    },
    datePublished: options.publishDate.toISOString(),
    dateModified: (options.updatedDate ?? options.publishDate).toISOString(),
    inLanguage: "fr-FR",
    author: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE.name,
      url: `${SITE.url}/a-propos/`,
    },
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE.name,
      logo: LOGO,
    },
    isPartOf: { "@id": `${SITE.url}/blog/#blog` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE.url}/blog/${options.slug}/`,
    },
  };
}
