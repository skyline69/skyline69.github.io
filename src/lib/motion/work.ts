import { gsap } from 'gsap';
import type { Capabilities } from '../effects/detect';

// ── Work scene: pick a project, swap its image, magnetic Visit disc ──

/** Minimal Liquid surface the work scene can disturb on image swaps. */
export interface Splashable {
  splat: (x: number, y: number, dx: number, dy: number) => void;
}

export interface Work {
  /** Attach or detach the Liquid effect (null when it is not running). */
  setLiquid: (liquid: Splashable | null) => void;
  /** Hide transient UI (the Visit disc) when the scene is left. */
  reset: () => void;
}

interface Point {
  x: number;
  y: number;
}

/** Splats per image swap and their outward push, in Liquid pointer units. */
const SPLAT_COUNT: number = 8;
const SPLAT_FORCE: number = 60;

function indexOf(element: HTMLElement): number {
  return Number(element.dataset['index'] ?? '-1');
}

/**
 * Pointer position inside `frame`, clamped to its box. Keyboard focus uses the centre.
 */
function pointIn(frame: HTMLElement, event: PointerEvent | FocusEvent): Point {
  if (event instanceof PointerEvent) {
    const rect: DOMRect = frame.getBoundingClientRect();
    return {
      x: gsap.utils.clamp(0, rect.width, event.clientX - rect.left),
      y: gsap.utils.clamp(0, rect.height, event.clientY - rect.top),
    };
  }
  return { x: frame.clientWidth / 2, y: frame.clientHeight / 2 };
}

/**
 * A ring of Liquid splats around a point reads as a ripple.
 */
function ripple(liquid: Splashable, frame: HTMLElement, origin: Point): void {
  const u: number = origin.x / frame.clientWidth;
  const v: number = 1 - origin.y / frame.clientHeight;
  for (let i: number = 0; i < SPLAT_COUNT; i += 1) {
    const angle: number = (i / SPLAT_COUNT) * Math.PI * 2;
    liquid.splat(u, v, Math.cos(angle) * SPLAT_FORCE, Math.sin(angle) * SPLAT_FORCE);
  }
}

/**
 * Shutter swap: vertical blinds drop over the frame, the image changes while it is fully
 * covered, then the blinds fall away. Only one figure is ever visible, and a new swap
 * started mid-way simply continues from wherever the blinds are.
 */
function createShutter(
  figures: readonly HTMLElement[],
  blinds: readonly HTMLElement[],
  animate: boolean,
): (index: number) => void {
  let timeline: gsap.core.Timeline | null = null;

  const show = (index: number): void => {
    figures.forEach((figure: HTMLElement): void => {
      figure.classList.toggle('is-active', indexOf(figure) === index);
    });
  };

  if (!animate || blinds.length === 0) {
    return show;
  }

  // Parked above the frame until a swap pulls them down.
  gsap.set(blinds, { yPercent: -101, visibility: 'visible' });

  return (index: number): void => {
    timeline?.kill();
    const image: HTMLImageElement | null =
      figures.find((f: HTMLElement): boolean => indexOf(f) === index)?.querySelector('img') ?? null;
    timeline = gsap
      .timeline()
      .to(blinds, { yPercent: 0, duration: 0.3, ease: 'power3.in', stagger: 0.035 })
      .add((): void => {
        show(index);
      });
    if (image) {
      timeline.fromTo(image, { scale: 1.12 }, { scale: 1, duration: 0.9, ease: 'expo.out' });
    }
    timeline
      .to(blinds, { yPercent: 101, duration: 0.5, ease: 'expo.out', stagger: 0.035 }, '<')
      .set(blinds, { yPercent: -101 });
  };
}

/**
 * Bring the top of the scene (and with it the image frame) back into view. Covers both the
 * scene's own scroller (desktop) and the page (touch screens).
 */
function scrollToTop(scene: HTMLElement, smooth: boolean): void {
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
  if (scene.scrollTop > 0) {
    scene.scrollTo({ top: 0, behavior });
  }
  if (window.scrollY > 0) {
    window.scrollTo({ top: 0, behavior });
  }
}

/**
 * The Visit disc trails the cursor over the image frame.
 */
function bindVisitDisc(frame: HTMLElement, disc: HTMLElement): () => void {
  const moveX: gsap.QuickToFunc = gsap.quickTo(disc, 'x', { duration: 0.45, ease: 'power3.out' });
  const moveY: gsap.QuickToFunc = gsap.quickTo(disc, 'y', { duration: 0.45, ease: 'power3.out' });

  // Keep the whole disc inside the frame, even when the cursor hugs an edge.
  const inside = (event: PointerEvent): Point => {
    const point: Point = pointIn(frame, event);
    const radius: number = disc.offsetWidth / 2;
    return {
      x: gsap.utils.clamp(radius, frame.clientWidth - radius, point.x),
      y: gsap.utils.clamp(radius, frame.clientHeight - radius, point.y),
    };
  };

  frame.addEventListener('pointerenter', (event: PointerEvent): void => {
    const point: Point = inside(event);
    gsap.set(disc, { x: point.x, y: point.y });
    gsap.to(disc, {
      scale: 1,
      autoAlpha: 1,
      duration: 0.5,
      ease: 'back.out(2)',
      overwrite: 'auto',
    });
  });
  frame.addEventListener('pointermove', (event: PointerEvent): void => {
    const point: Point = inside(event);
    moveX(point.x);
    moveY(point.y);
  });
  // `overwrite: 'auto'` cancels a show still running, so a quick exit always wins.
  const hide = (): void => {
    gsap.to(disc, {
      scale: 0.4,
      autoAlpha: 0,
      duration: 0.3,
      ease: 'power2.in',
      overwrite: 'auto',
    });
  };
  frame.addEventListener('pointerleave', hide);
  return hide;
}

/**
 * Wire up the project list, detail panels, image frame and Visit disc.
 */
export function initWork(scene: HTMLElement, capabilities: Capabilities): Work | null {
  const items: HTMLAnchorElement[] = gsap.utils.toArray<HTMLAnchorElement>(
    '[data-work-item]',
    scene,
  );
  const details: HTMLElement[] = gsap.utils.toArray<HTMLElement>('[data-work-detail]', scene);
  const figures: HTMLElement[] = gsap.utils.toArray<HTMLElement>('[data-work-figure]', scene);
  const frame: HTMLAnchorElement | null =
    scene.querySelector<HTMLAnchorElement>('[data-work-frame]');
  const disc: HTMLElement | null = scene.querySelector<HTMLElement>('[data-visit-disc]');
  const blinds: HTMLElement[] = gsap.utils.toArray<HTMLElement>('[data-work-blind]', scene);
  if (!frame || items.length === 0) {
    return null;
  }
  const swapTo: (index: number) => void = createShutter(
    figures,
    blinds,
    !capabilities.reducedMotion,
  );

  let active: number = 0;
  let liquid: Splashable | null = null;

  const select = (item: HTMLAnchorElement, origin: Point): void => {
    const next: number = indexOf(item);
    if (next === active || next < 0) {
      return;
    }
    active = next;

    items.forEach((other: HTMLAnchorElement): void => {
      other.toggleAttribute('data-active', other === item);
    });
    details.forEach((detail: HTMLElement): void => {
      detail.classList.toggle('is-active', indexOf(detail) === next);
    });
    frame.href = item.href;
    frame.setAttribute('aria-label', `Open ${item.dataset['title'] ?? 'project'}`);

    swapTo(next);
    if (liquid && !capabilities.reducedMotion) {
      ripple(liquid, frame, origin);
    }
  };

  items.forEach((item: HTMLAnchorElement): void => {
    item.addEventListener('pointerenter', (event: PointerEvent): void => {
      if (event.pointerType === 'mouse') {
        select(item, pointIn(frame, event));
      }
    });
    item.addEventListener('focus', (event: FocusEvent): void => {
      select(item, pointIn(frame, event));
    });
    item.addEventListener('click', (event: MouseEvent): void => {
      // First tap on touch screens selects and scrolls up to show the new image;
      // the second tap follows the link.
      if (indexOf(item) !== active) {
        event.preventDefault();
        select(item, { x: frame.clientWidth / 2, y: frame.clientHeight / 2 });
        scrollToTop(scene, !capabilities.reducedMotion);
      }
    });
  });

  const hideDisc: (() => void) | null =
    disc && capabilities.finePointer && !capabilities.reducedMotion
      ? bindVisitDisc(frame, disc)
      : null;

  return {
    setLiquid: (next: Splashable | null): void => {
      liquid = next;
    },
    reset: (): void => {
      hideDisc?.();
    },
  };
}
