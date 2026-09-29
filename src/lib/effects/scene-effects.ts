import type { SceneId } from '../scenes/state';
import type { Splashable } from '../motion/work';

// ── Per-scene Canvas UI effects: loaded lazily, only one running at a time ──

export interface SceneEffectHooks {
  /** Liquid started on the work frame, or stopped (null). */
  onLiquid: (liquid: Splashable | null) => void;
}

export interface SceneEffects {
  /** Start the effect that belongs to a scene. Safe to call for scenes without one. */
  activate: (id: SceneId) => void;
  /** Stop whatever effect is running and restore its DOM. */
  deactivate: () => void;
}

/** Starts one effect and resolves to its stop function, or null when it could not start. */
type Loader = (host: HTMLElement, hooks: SceneEffectHooks) => Promise<(() => void) | null>;

const LOADERS: Readonly<Record<SceneId, { selector: string; load: Loader } | null>> = {
  intro: null,
  work: {
    selector: '[data-effect="liquid"]',
    load: async (host: HTMLElement, hooks: SceneEffectHooks): Promise<(() => void) | null> => {
      const { mountLiquid } = await import('./liquid');
      const mounted = mountLiquid(host);
      if (!mounted) {
        return null;
      }
      hooks.onLiquid(mounted.instance);
      return (): void => {
        mounted.unmount();
        hooks.onLiquid(null);
      };
    },
  },
  stack: null,
  me: null,
};

const NOOP_EFFECTS: SceneEffects = {
  activate: (): void => {},
  deactivate: (): void => {},
};

/**
 * Effects manager. Returns no-ops when HTML-in-Canvas is unavailable, so other browsers never
 * download the WebGL code. A failed download or start leaves the CSS and GSAP fallback in place.
 */
export function createSceneEffects(
  stage: HTMLElement,
  enabled: boolean,
  hooks: SceneEffectHooks,
): SceneEffects {
  if (!enabled) {
    return NOOP_EFFECTS;
  }

  let generation: number = 0;
  let stop: (() => void) | null = null;

  return {
    activate: (id: SceneId): void => {
      generation += 1;
      const token: number = generation;
      const entry: { selector: string; load: Loader } | null = LOADERS[id];
      const host: HTMLElement | null = entry
        ? stage.querySelector<HTMLElement>(entry.selector)
        : null;
      if (!entry || !host) {
        return;
      }
      entry.load(host, hooks).then(
        (stopEffect: (() => void) | null): void => {
          if (token === generation) {
            stop = stopEffect;
          } else {
            // The scene changed while loading: tear down right away.
            stopEffect?.();
          }
        },
        (): void => {},
      );
    },
    deactivate: (): void => {
      generation += 1;
      stop?.();
      stop = null;
    },
  };
}
