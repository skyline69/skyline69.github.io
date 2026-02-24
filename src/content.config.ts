import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    repoUrl: z.string(),
    image: image(),
    tags: z.array(z.string()).default([]),
    order: z.number(),
    active: z.boolean().default(true),
  }),
});

const tech = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tech' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    icon: image(),
    url: z.string(),
    accent: z.string().optional(),
    order: z.number(),
    active: z.boolean().default(true),
  }),
});

const profile = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/profile' }),
  schema: z.object({
    name: z.string(),
    birthDate: z.string(),
    summary: z.array(z.string()),
    locationLine: z.string(),
    languages: z.array(z.string()),
  }),
});

const highlights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/highlights' }),
  schema: z.object({
    title: z.string(),
    body: z.string(),
    order: z.number(),
    active: z.boolean().default(true),
  }),
});

export const collections = { projects, tech, profile, highlights };
