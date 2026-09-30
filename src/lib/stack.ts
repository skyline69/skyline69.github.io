import { MESSAGES, type Locale } from './i18n';

// ── Stack graph: which tech is used where ──

/** Minimal tech shape needed to build the stack wall. */
export interface TechRef {
  name: string;
  url: string;
}

/** Minimal project shape needed to relate tech to projects. */
export interface ProjectRef {
  title: string;
  tags: readonly string[];
}

/** Project links resolved for one tech. */
export interface StackLinks {
  /** Titles of projects tagged with this tech, in project order. */
  usedIn: string[];
  /** Other tech in the stack that shares at least one project with this one. */
  related: string[];
}

/** One tile in the stack, with its project links resolved. */
export type StackItem<T extends TechRef = TechRef> = T & StackLinks;

/**
 * Join names into a readable list: "A", "A and B", "A, B and C".
 */
export function formatList(items: readonly string[], locale: Locale = 'en'): string {
  if (items.length <= 1) {
    return items.join('');
  }
  const head: string[] = items.slice(0, -1);
  const tail: string = items.at(-1) ?? '';
  return `${head.join(', ')} ${MESSAGES[locale].and} ${tail}`;
}

/**
 * Sentence shown when a stack word is active.
 */
export function formatUsedIn(usedIn: readonly string[], locale: Locale = 'en'): string {
  if (usedIn.length === 0) {
    return MESSAGES[locale].unused;
  }
  return MESSAGES[locale].usedIn(formatList(usedIn, locale));
}

/**
 * Resolve, for every tech, the projects using it and the tech it ships with.
 * Tags are matched to tech names exactly, so the two must be spelled the same.
 */
export function buildStack<T extends TechRef>(
  tech: readonly T[],
  projects: readonly ProjectRef[],
): StackItem<T>[] {
  const names: Set<string> = new Set(tech.map((t: T): string => t.name));

  return tech.map((t: T): StackItem<T> => {
    const using: ProjectRef[] = projects.filter((p: ProjectRef): boolean =>
      p.tags.includes(t.name),
    );
    const related: Set<string> = new Set();
    for (const project of using) {
      for (const tag of project.tags) {
        if (tag !== t.name && names.has(tag)) {
          related.add(tag);
        }
      }
    }
    return {
      ...t,
      usedIn: using.map((p: ProjectRef): string => p.title),
      related: tech
        .map((other: T): string => other.name)
        .filter((name: string): boolean => related.has(name)),
    };
  });
}
