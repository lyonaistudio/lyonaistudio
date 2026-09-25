import { SITE } from "./site";

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE.url}/#business`,
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    email: SITE.email,
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: SITE.country,
    },
    // Basé à Lyon (adresse ci-dessus) mais l'activité couvre toute la France
    // à distance — areaServed doit refléter ça, pas seulement la ville.
    areaServed: {
      "@type": "Country",
      name: "France",
    },
    openingHoursSpecification: SITE.hoursSchema,
    sameAs: SITE.sameAs,
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
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: options.title,
    description: options.description,
    image: `${SITE.url}${options.image}`,
    datePublished: options.publishDate.toISOString(),
    author: {
      "@type": "Organization",
      name: SITE.name,
      url: `${SITE.url}/a-propos/`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
    },
    mainEntityOfPage: `${SITE.url}/blog/${options.slug}/`,
  };
}
