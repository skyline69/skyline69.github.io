import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// ── Profile (singleton) ──
const profile = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/profile' }),
  schema: z.object({
    name: z.string(),
    handle: z.string(),
    birthDate: z.string(),
    headline: z.string(),
    headlineAccent: z.string(),
    intro: z.string(),
    summary: z.array(z.string()),
    origin: z.string(),
    languages: z.array(z.string()),
    next: z.string(),
    githubUrl: z.url(),
  }),
});

// ── Projects ──
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      repoUrl: z.url(),
      siteUrl: z.url().optional(),
      image: image(),
      visual: z.enum(['screenshot', 'icon']),
      tags: z.array(z.string()).default([]),
      status: z.enum(['active', 'archived']).default('active'),
      note: z.string().optional(),
      order: z.number(),
      active: z.boolean().default(true),
    }),
});

// ── Tech stack ──
const tech = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tech' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      icon: image(),
      url: z.url(),
      order: z.number(),
      active: z.boolean().default(true),
    }),
});

// ── Highlights (cards in the Me scene) ──
const highlights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/highlights' }),
  schema: z.object({
    title: z.string(),
    body: z.string(),
    accent: z.string().optional(),
    order: z.number(),
    active: z.boolean().default(true),
  }),
});

export const collections = { profile, projects, tech, highlights };
