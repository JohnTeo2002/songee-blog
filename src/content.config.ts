import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { BLOG_TAGS } from "./consts";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.enum(BLOG_TAGS)),
    draft: z.boolean().default(false),
    /** Set this when an article is also syndicated to Dev.to / Hashnode. */
    canonicalUrl: z.string().url().optional(),
    heroAlt: z.string().optional(),
  }),
});

export const collections = { blog };
