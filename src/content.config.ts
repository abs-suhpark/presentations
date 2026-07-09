import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const presentations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/markdown' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    cover: image().optional(),
    order: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

const slides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/slides' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    order: z.number().optional(),
    theme: z.enum(['coffee']).default('coffee'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { presentations, slides };
