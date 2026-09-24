// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';
import { EnumChangefreq } from 'sitemap';

const LOW_PRIORITY_PATHS = ['/cgv/', '/mentions-legales/', '/404/'];
const BLOG_POST_PREFIX = '/blog/';

// https://astro.build/config
export default defineConfig({
  site: 'https://lyonaistudio.fr',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname;
        const isHome = path === '/';
        const isLegal = LOW_PRIORITY_PATHS.includes(path);
        const isBlogPost = path.startsWith(BLOG_POST_PREFIX) && path !== BLOG_POST_PREFIX;

        item.lastmod = new Date().toISOString();
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
