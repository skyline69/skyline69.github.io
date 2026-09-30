import { SCENE_IDS, indexOfScene, type SceneId } from '../scenes/state';
import { createCounter, type Counter } from './counter';
import { createNavIndicator, type NavIndicator } from './nav';

// ── Header chrome: current tab, sliding underline and rolling scene counter ──

export interface HeaderChrome {
  /** Point the header at a scene. Calling it again with the same scene does nothing. */
  moveTo: (id: SceneId) => void;
}

function markCurrent(id: SceneId): void {
  document
    .querySelectorAll<HTMLAnchorElement>('[data-nav]')
    .forEach((link: HTMLAnchorElement): void => {
      if (link.dataset['nav'] === id) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
}

/**
 * Wire up the header for a stage that starts on `initial`.
 */
export function createHeaderChrome(initial: SceneId, reducedMotion: boolean): HeaderChrome {
  const nav: NavIndicator | null = createNavIndicator(initial, reducedMotion);
  const counterEl: HTMLElement | null = document.querySelector<HTMLElement>('[data-counter]');
  const counter: Counter | null = counterEl
    ? createCounter(counterEl, indexOfScene(initial), SCENE_IDS.length, reducedMotion)
    : null;
  markCurrent(initial);

  return {
    moveTo: (id: SceneId): void => {
      markCurrent(id);
      nav?.moveTo(id);
      counter?.set(indexOfScene(id));
    },
  };
}
