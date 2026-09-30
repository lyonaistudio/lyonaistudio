import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { isPublished } from "../lib/blog";
import { SITE } from "../lib/site";
import { SERVICES } from "../lib/schema";

// llms.txt (https://llmstxt.org) : résumé du site à destination des moteurs de
// recherche IA (ChatGPT, Perplexity, Google AI Overviews…), pour qu'ils
// comprennent l'activité et citent les bonnes pages.
export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog", isPublished)).sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.name} est un studio web basé à ${SITE.city} (France) qui travaille à distance avec des entreprises partout en France : TPE, PME, commerces, artisans, indépendants et professions libérales. Devis gratuit et sans engagement, réponse sous 48 h ouvrées. Contact : ${SITE.email}.

## Services

${SERVICES.map((service) => `- [${service.name}](${SITE.url}${service.path})`).join("\n")}

## Informations

- [À propos](${SITE.url}/a-propos/): qui est derrière ${SITE.name}
- [Déroulement d'un projet](${SITE.url}/comment-ca-se-passe/): les étapes, du premier échange à la mise en ligne
- [FAQ](${SITE.url}/faq/): prix, délais, référencement, maintenance, automatisation
- [Contact et devis](${SITE.url}/contact/)

## Articles

${posts.map((post) => `- [${post.data.title}](${SITE.url}/blog/${post.id}/): ${post.data.description}`).join("\n")}
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
