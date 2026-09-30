import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    // Titre de l'onglet / résultat Google (≤ 60 caractères) quand le titre de
    // l'article est plus long ; à défaut, le titre de l'article est utilisé.
    seoTitle: z.string().optional(),
    description: z.string(),
    publishDate: z.date(),
    updatedDate: z.date().optional(),
    image: z.string(),
    imageAlt: z.string(),
  }),
});

export const collections = { blog };
