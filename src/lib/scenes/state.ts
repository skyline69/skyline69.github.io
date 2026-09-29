// ── Scene state: pure helpers shared by the controller and the markup ──

/** Scene ids in stage order. Each id is also the section id and the URL hash. */
export const SCENE_IDS = ['intro', 'work', 'stack', 'me'] as const;

export type SceneId = (typeof SCENE_IDS)[number];

/** Human labels for nav, rail and footer. */
export const SCENE_LABELS: Readonly<Record<SceneId, string>> = {
  intro: 'Intro',
  work: 'Work',
  stack: 'Stack',
  me: 'Me',
};

/**
 * Type guard for scene ids coming from the DOM or the URL.
 */
export function isSceneId(value: string): value is SceneId {
  return (SCENE_IDS as readonly string[]).includes(value);
}

/**
 * Read a scene id from a location hash like "#work". Unknown hashes give null.
 */
export function sceneFromHash(hash: string): SceneId | null {
  const id: string = hash.startsWith('#') ? hash.slice(1) : hash;
  return isSceneId(id) ? id : null;
}

/**
 * Position of a scene in stage order.
 */
export function indexOfScene(id: SceneId): number {
  return SCENE_IDS.indexOf(id);
}

/**
 * Scene at a position, or null when out of range.
 */
export function sceneAt(index: number): SceneId | null {
  return SCENE_IDS[index] ?? null;
}

/**
 * Move from one index by a delta, clamped to the stage. The stage does not wrap.
 */
export function stepIndex(current: number, delta: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.min(count - 1, Math.max(0, current + delta));
}

/**
 * Zero-padded two-digit number, like "03".
 */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Two-digit counter like "02 / 04".
 */
export function formatCounter(index: number, count: number): string {
  return `${pad2(index + 1)} / ${pad2(count)}`;
}
