import { getCollection } from 'astro:content';

/**
 * Load active highlights, sorted by order.
 */
export async function getActiveHighlights() {
  const entries = await getCollection('highlights', ({ data }) => data.active !== false);
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/**
 * Load active projects, sorted by order.
 */
export async function getActiveProjects() {
  const entries = await getCollection('projects', ({ data }) => data.active !== false);
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/**
 * Load active tech items, sorted by order.
 */
export async function getActiveTech() {
  const entries = await getCollection('tech', ({ data }) => data.active !== false);
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/**
 * Load the single profile entry.
 */
export async function getProfile() {
  const entries = await getCollection('profile');
  return entries[0];
}
