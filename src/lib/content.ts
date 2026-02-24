import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Load active highlights, sorted by order.
 */
export async function getActiveHighlights(): Promise<CollectionEntry<'highlights'>[]> {
  const entries: CollectionEntry<'highlights'>[] = await getCollection(
    'highlights',
    (entry: CollectionEntry<'highlights'>): boolean => entry.data.active !== false,
  );
  return entries.sort(
    (a: CollectionEntry<'highlights'>, b: CollectionEntry<'highlights'>): number =>
      a.data.order - b.data.order,
  );
}

/**
 * Load active projects, sorted by order.
 */
export async function getActiveProjects(): Promise<CollectionEntry<'projects'>[]> {
  const entries: CollectionEntry<'projects'>[] = await getCollection(
    'projects',
    (entry: CollectionEntry<'projects'>): boolean => entry.data.active !== false,
  );
  return entries.sort(
    (a: CollectionEntry<'projects'>, b: CollectionEntry<'projects'>): number =>
      a.data.order - b.data.order,
  );
}

/**
 * Load active tech items, sorted by order.
 */
export async function getActiveTech(): Promise<CollectionEntry<'tech'>[]> {
  const entries: CollectionEntry<'tech'>[] = await getCollection(
    'tech',
    (entry: CollectionEntry<'tech'>): boolean => entry.data.active !== false,
  );
  return entries.sort(
    (a: CollectionEntry<'tech'>, b: CollectionEntry<'tech'>): number =>
      a.data.order - b.data.order,
  );
}

/**
 * Load the single profile entry.
 */
export async function getProfile(): Promise<CollectionEntry<'profile'>> {
  const entries: CollectionEntry<'profile'>[] = await getCollection('profile');
  return entries[0];
}
