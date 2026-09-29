import type { Capabilities } from '../effects/detect';
import { createEmbers, type Embers } from './embers';
import type { Fire } from './fire';

// ── Name effects: shader fire behind the letters, embers above them ──

export interface NameFx {
  /** Light up; the fire grows in after `delay` seconds. */
  start: (delay: number) => void;
  stop: () => void;
}

/**
 * Fire and embers around the intro name. The fire shader (and OGL with it) is loaded
 * on first start, so it stays out of the first page load. Returns null when the intro
 * markup is missing.
 */
export function createNameFx(intro: HTMLElement, capabilities: Capabilities): NameFx | null {
  const name: HTMLElement | null = intro.querySelector<HTMLElement>('[data-intro-name]');
  const fireHost: HTMLElement | null = intro.querySelector<HTMLElement>('[data-name-fire]');
  const emberCanvas: HTMLCanvasElement | null =
    intro.querySelector<HTMLCanvasElement>('[data-name-embers]');
  if (!name) {
    return null;
  }
  const embers: Embers | null = emberCanvas
    ? createEmbers(emberCanvas, name, capabilities.reducedMotion)
    : null;

  let fire: Fire | null = null;
  let loading: boolean = false;
  let wanted: boolean = false;

  const loadFire = (delay: number): void => {
    if (loading || !fireHost || capabilities.reducedMotion) {
      return;
    }
    loading = true;
    import('./fire').then(
      ({ createFire }): void => {
        fire = createFire(fireHost, name, capabilities.reducedMotion);
        if (wanted) {
          fire?.start(delay);
        }
      },
      // Without the shader the name keeps its colours, glow and embers.
      (): void => {},
    );
  };

  return {
    start: (delay: number): void => {
      wanted = true;
      embers?.start();
      if (fire) {
        fire.start(delay);
      } else {
        loadFire(delay);
      }
    },
    stop: (): void => {
      wanted = false;
      fire?.stop();
      embers?.stop();
    },
  };
}
