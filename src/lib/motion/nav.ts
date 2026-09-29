import { gsap } from 'gsap';
import type { SceneId } from '../scenes/state';

// ── Nav indicator: one underline that stretches from tab to tab ──

export interface NavIndicator {
  /** Slide the underline under a scene's tab. */
  moveTo: (id: SceneId) => void;
}

interface Span {
  x: number;
  width: number;
}

function spanOf(link: HTMLElement): Span {
  return { x: link.offsetLeft, width: link.offsetWidth };
}

/**
 * The underline first stretches to reach the new tab, then pulls its tail in behind it.
 */
export function createNavIndicator(initial: SceneId, reducedMotion: boolean): NavIndicator | null {
  const bar: HTMLElement | null = document.querySelector<HTMLElement>('[data-nav-indicator]');
  const links: HTMLElement[] = gsap.utils.toArray<HTMLElement>('[data-nav]');
  if (!bar || links.length === 0) {
    return null;
  }

  const linkFor = (id: SceneId): HTMLElement | undefined =>
    links.find((link: HTMLElement): boolean => link.dataset['nav'] === id);

  let current: SceneId = initial;

  const snap = (): void => {
    const link: HTMLElement | undefined = linkFor(current);
    if (link) {
      const span: Span = spanOf(link);
      gsap.set(bar, { x: span.x, width: span.width });
    }
  };

  // Tab widths depend on the web font, so measure once it is ready.
  void document.fonts.ready.then((): void => {
    snap();
    gsap.to(bar, { autoAlpha: 1, duration: 0.4 });
  });
  window.addEventListener('resize', snap);

  return {
    moveTo: (id: SceneId): void => {
      const from: HTMLElement | undefined = linkFor(current);
      const to: HTMLElement | undefined = linkFor(id);
      current = id;
      if (!from || !to || from === to) {
        return;
      }
      const a: Span = spanOf(from);
      const b: Span = spanOf(to);
      gsap.killTweensOf(bar);

      if (reducedMotion) {
        gsap.set(bar, { x: b.x, width: b.width });
        return;
      }

      const movingRight: boolean = b.x > a.x;
      const reach: Span = movingRight
        ? { x: a.x, width: b.x + b.width - a.x }
        : { x: b.x, width: a.x + a.width - b.x };

      gsap
        .timeline()
        .to(bar, { x: reach.x, width: reach.width, duration: 0.28, ease: 'power3.in' })
        .to(bar, { x: b.x, width: b.width, duration: 0.55, ease: 'expo.out' });
    },
  };
}
