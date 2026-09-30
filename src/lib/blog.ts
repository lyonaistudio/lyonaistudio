import type { CollectionEntry } from "astro:content";

// Publication programmée : un article n'est publié qu'à partir de sa
// publishDate. Le site est reconstruit chaque matin (workflow GitHub), ce qui
// met en ligne automatiquement les articles arrivés à leur date.
export const isPublished = (post: CollectionEntry<"blog">) => post.data.publishDate.valueOf() <= Date.now();
