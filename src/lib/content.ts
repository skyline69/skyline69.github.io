import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { buildStack, type StackItem, type TechRef } from './stack';

/** Tech as the stack scene needs it: name, link and logo. */
export interface TechTile extends TechRef {
  icon: ImageMetadata;
}

type Ordered = { data: { order: number } };

function byOrder(a: Ordered, b: Ordered): number {
  return a.data.order - b.data.order;
}

/**
 * Load active highlights, sorted by order.
 */
export async function getActiveHighlights(): Promise<CollectionEntry<'highlights'>[]> {
  const entries: CollectionEntry<'highlights'>[] = await getCollection(
    'highlights',
    (entry: CollectionEntry<'highlights'>): boolean => entry.data.active,
  );
  return entries.toSorted(byOrder);
}

/**
 * Load active projects, sorted by order.
 */
export async function getActiveProjects(): Promise<CollectionEntry<'projects'>[]> {
  const entries: CollectionEntry<'projects'>[] = await getCollection(
    'projects',
    (entry: CollectionEntry<'projects'>): boolean => entry.data.active,
  );
  return entries.toSorted(byOrder);
}

/**
 * Load active tech items, sorted by order.
 */
export async function getActiveTech(): Promise<CollectionEntry<'tech'>[]> {
  const entries: CollectionEntry<'tech'>[] = await getCollection(
    'tech',
    (entry: CollectionEntry<'tech'>): boolean => entry.data.active,
  );
  return entries.toSorted(byOrder);
}

/**
 * Load the single profile entry. Fails the build when it is missing.
 */
export async function getProfile(): Promise<CollectionEntry<'profile'>> {
  const entries: CollectionEntry<'profile'>[] = await getCollection('profile');
  const entry: CollectionEntry<'profile'> | undefined = entries[0];
  if (!entry) {
    throw new Error('Missing profile entry in src/content/profile');
  }
  return entry;
}

/**
 * Tech wall items with the projects that use them resolved from project tags.
 */
export async function getStack(): Promise<StackItem<TechTile>[]> {
  const [tech, projects] = await Promise.all([getActiveTech(), getActiveProjects()]);
  return buildStack(
    tech.map((t: CollectionEntry<'tech'>): TechTile => ({
      name: t.data.name,
      url: t.data.url,
      icon: t.data.icon,
    })),
    projects.map((p: CollectionEntry<'projects'>) => ({ title: p.data.title, tags: p.data.tags })),
  );
}
