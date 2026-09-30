import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * The same text fields once per translated locale (see `TranslatedLocale` in lib/i18n.ts).
 * Both are required, so a new entry cannot ship half translated.
 */
function translations<T extends z.ZodType>(text: T): z.ZodObject<{ de: T; tr: T }> {
  return z.object({ de: text, tr: text });
}

// ── Profile (singleton) ──
const profileText = z.object({
  headline: z.string(),
  headlineAccent: z.string(),
  intro: z.string(),
  summary: z.array(z.string()),
  origin: z.string(),
  languages: z.array(z.string()),
  next: z.string(),
});

const profile = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/profile' }),
  schema: profileText.extend({
    name: z.string(),
    handle: z.string(),
    birthDate: z.string(),
    githubUrl: z.url(),
    translations: translations(profileText),
  }),
});

// ── Projects ──
const projectText = z.object({
  description: z.string(),
  note: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    projectText.extend({
      title: z.string(),
      repoUrl: z.url(),
      siteUrl: z.url().optional(),
      image: image(),
      visual: z.enum(['screenshot', 'icon']),
      tags: z.array(z.string()).default([]),
      status: z.enum(['active', 'archived']).default('active'),
      translations: translations(projectText),
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
const highlightText = z.object({
  title: z.string(),
  body: z.string(),
  accent: z.string().optional(),
});

const highlights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/highlights' }),
  schema: highlightText.extend({
    translations: translations(highlightText),
    order: z.number(),
    active: z.boolean().default(true),
  }),
});

export const collections = { profile, projects, tech, highlights };
