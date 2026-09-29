import { gsap } from 'gsap';
import { prefersReducedMotion } from '../effects/detect';

// ── Page geometry during a switch (touch screens, where the page itself scrolls) ──

/**
 * The mist glides down to the incoming scene within this time, which is never longer than
 * a wipe, so it has arrived when the page moves back up.
 */
const MIST_GLIDE_S: number = 0.7;

/** How far down the page each overlaid scene sits while a switch runs. */
const offsets: WeakMap<HTMLElement, number> = new WeakMap();

/**
 * Overlay the scenes for a switch without moving the page. A new scene is placed where the
 * reader is scrolled to, so it arrives on screen; a scene gliding back keeps its place. The
 * page stays tall enough for every scene, the bottom fade moves to where the incoming scene
 * ends, and the wipe seam follows that scene.
 */
export function holdPage(to: HTMLElement, resuming: boolean): void {
  const inner: HTMLElement | null = to.parentElement;
  if (!inner) {
    return;
  }
  // Pin the current height first: with every scene lifted out of the flow the page would
  // shrink for a moment and the browser would clamp the scroll position.
  const before: number = inner.offsetHeight;
  const scrollY: number = window.scrollY;
  inner.style.minHeight = `${before}px`;
  inner.classList.add('is-switching');
  if (!resuming) {
    offsets.set(to, scrollY);
  }
  const top: number = offsets.get(to) ?? 0;
  to.style.top = `${top}px`;
  const height: number = to.offsetHeight;
  inner.style.minHeight = `${Math.max(before, top + height)}px`;
  inner.style.setProperty('--page-end', `${top + height}px`);
  inner.style.setProperty('--switch-top', `${top}px`);
  inner.style.setProperty('--switch-height', `${height}px`);
  // The mist scrolls with the page. Glide it down to the incoming scene, so it already sits
  // where it will be once the page is back at the top. (Pinning it to the screen instead
  // makes Safari 26 paint a solid bar under its toolbar.)
  const mist: HTMLElement | null = inner.querySelector<HTMLElement>('.mist');
  if (!mist) {
    return;
  }
  gsap.to(mist, {
    y: top,
    duration: prefersReducedMotion() ? 0 : MIST_GLIDE_S,
    ease: 'expo.inOut',
    overwrite: true,
  });
}

/**
 * Put the active scene back at the top of the page and scroll by the same amount, so
 * nothing on screen moves.
 */
export function releasePage(to: HTMLElement, scenes: readonly HTMLElement[]): void {
  const inner: HTMLElement | null = to.parentElement;
  if (!inner) {
    return;
  }
  const top: number = offsets.get(to) ?? 0;
  scenes.forEach((scene: HTMLElement): void => {
    offsets.delete(scene);
    scene.style.removeProperty('top');
  });
  inner.classList.remove('is-switching');
  const mist: HTMLElement | null = inner.querySelector<HTMLElement>('.mist');
  if (mist) {
    gsap.set(mist, { y: 0, overwrite: true });
  }
  ['min-height', '--page-end', '--switch-top', '--switch-height'].forEach((name: string): void => {
    inner.style.removeProperty(name);
  });
  window.scrollTo({ top: Math.max(0, window.scrollY - top), behavior: 'instant' });
}
