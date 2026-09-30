import type { CollectionEntry } from 'astro:content';
import type { AgentCard, AgentProject, AgentSite, AgentTool } from './agents';
import {
  getActiveHighlights,
  getActiveProjects,
  getProfile,
  getStack,
  type TechTile,
} from './content';
import { fillAge, getAge } from './date';
import { MESSAGES, textIn, type Locale } from './i18n';
import type { StackItem } from './stack';

// ── Site-wide data shared by the page and the agent files ──

type Profile = CollectionEntry<'profile'>['data'];

/** Canonical site root, with a trailing slash. */
export const DEFAULT_SITE: URL = new URL('https://dasguney.com/');

/** Title and meta description, so the page and the Markdown copy always agree. */
export interface SiteMeta {
  title: string;
  description: string;
}

/**
 * Page title and meta description for a profile, in one locale.
 */
export function siteMeta(profile: Profile, locale: Locale = 'en'): SiteMeta {
  const title: string = `${profile.name} (${profile.handle})`;
  const intro: string = textIn(profile, profile.translations, locale).intro;
  return { title, description: `${title} ${MESSAGES[locale].tagline} ${intro}` };
}

/**
 * Everything on the page as plain data, for robots, Markdown and llms.txt.
 */
export async function loadAgentSite(site: URL): Promise<AgentSite> {
  const [profileEntry, projectEntries, highlightEntries, stack] = await Promise.all([
    getProfile(),
    getActiveProjects(),
    getActiveHighlights(),
    getStack(),
  ]);
  const profile: Profile = profileEntry.data;
  const age: number = getAge(profile.birthDate);

  return {
    ...siteMeta(profile),
    url: new URL('/', site).href,
    name: profile.name,
    headline: `${profile.headline} ${profile.headlineAccent}`,
    intro: profile.intro,
    summary: profile.summary.map((text: string): string => fillAge(text, age)),
    origin: profile.origin,
    languages: profile.languages,
    next: profile.next,
    githubUrl: profile.githubUrl,
    projects: projectEntries.map(({ data }: CollectionEntry<'projects'>): AgentProject => ({
      title: data.title,
      description: data.description,
      tags: data.tags,
      repoUrl: data.repoUrl,
      siteUrl: data.siteUrl,
      archived: data.status === 'archived',
      note: data.note,
    })),
    stack: stack.map((item: StackItem<TechTile>): AgentTool => ({
      name: item.name,
      url: item.url,
      usedIn: item.usedIn,
    })),
    cards: highlightEntries.map(({ data }: CollectionEntry<'highlights'>): AgentCard => ({
      title: data.title,
      body: data.body,
      accent: data.accent,
    })),
  };
}
