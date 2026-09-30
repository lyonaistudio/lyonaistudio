// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';
import typographieFr from './src/integrations/typographie-fr.mjs';
import { EnumChangefreq } from 'sitemap';
import { readdirSync, readFileSync } from 'node:fs';

const LOW_PRIORITY_PATHS = ['/cgv/', '/mentions-legales/'];
const BLOG_POST_PREFIX = '/blog/';

// Vraie date de dernière modification de chaque article (updatedDate, sinon
// publishDate), lue dans le frontmatter : un lastmod qui change à chaque build
// finit par être ignoré par Google.
const BLOG_DIR = new URL('./src/content/blog/', import.meta.url);
const BLOG_LASTMOD = Object.fromEntries(
  readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(new URL(file, BLOG_DIR), 'utf8');
      /** @param {string} key */
      const date = (key) => source.match(new RegExp(`^${key}:\\s*(\\S+)`, 'm'))?.[1];
      return [`/blog/${file.replace(/\.md$/, '')}/`, date('updatedDate') ?? date('publishDate')];
    })
);
// Articles programmés (date future) exclus : ils ne sont pas encore publiés.
const TODAY = new Date().toISOString().slice(0, 10);
const LATEST_POST = Object.values(BLOG_LASTMOD).filter((d) => d && d <= TODAY).sort().at(-1);

// https://astro.build/config
export default defineConfig({
  site: 'https://lyonaistudio.fr',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    typographieFr(),
    sitemap({
      // La 404 est en noindex : elle n'a rien à faire dans le sitemap.
      filter: (page) => !page.endsWith('/404/'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const isHome = path === '/';
        const isLegal = LOW_PRIORITY_PATHS.includes(path);
        const isBlogPost = path.startsWith(BLOG_POST_PREFIX) && path !== BLOG_POST_PREFIX;

        const lastmod = BLOG_LASTMOD[path] ?? (path === BLOG_POST_PREFIX ? LATEST_POST : undefined);
        if (lastmod) item.lastmod = new Date(lastmod).toISOString();
        else delete item.lastmod;
        item.changefreq = isLegal
          ? EnumChangefreq.YEARLY
          : isBlogPost
            ? EnumChangefreq.MONTHLY
            : EnumChangefreq.WEEKLY;
        item.priority = isHome ? 1.0 : isLegal ? 0.3 : 0.8;

        return item;
      },
    }),
  ]
});
