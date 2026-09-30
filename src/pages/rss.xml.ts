import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { isPublished } from "../lib/blog";
import { SITE } from "../lib/site";

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Flux RSS des actualités : facilite la découverte des nouveaux articles par
// les agrégateurs et les moteurs de recherche.
export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog", isPublished)).sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );

  const items = posts
    .map((post) => {
      const url = `${SITE.url}/blog/${post.id}/`;
      return `    <item>
      <title>${escape(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escape(post.data.description)}</description>
      <pubDate>${post.data.publishDate.toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(`${SITE.name} — Actualités`)}</title>
    <link>${SITE.url}/blog/</link>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escape("Conseils sur la création de site internet, le référencement et l'automatisation par IA pour les TPE et PME.")}</description>
    <language>fr-FR</language>
    <lastBuildDate>${(posts[0]?.data.updatedDate ?? posts[0]?.data.publishDate ?? new Date()).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
};
