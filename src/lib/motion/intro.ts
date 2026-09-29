import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { Capabilities } from '../effects/detect';
import { revealScene } from './reveal';

// ── Intro: letter rise on load ──

/**
 * Load animation for the intro scene. Runs once the web font is ready so SplitText
 * measures the real glyphs. With `animate` off (another scene opened first, or reduced
 * motion) the hidden intro parts are simply shown.
 */
export async function playIntro(
  scene: HTMLElement,
  capabilities: Capabilities,
  animate: boolean,
): Promise<void> {
  const name: HTMLElement | null = scene.querySelector<HTMLElement>('[data-intro-name]');
  const headline: HTMLElement | null = scene.querySelector<HTMLElement>('[data-intro-headline]');
  const targets: HTMLElement[] = [name, headline].filter(
    (el: HTMLElement | null): el is HTMLElement => el !== null,
  );
  const hidden: HTMLElement[] = targets;

  // The CSS keeps these hidden (with a timed fallback) until the script takes over.
  const release = (): void => {
    hidden.forEach((el: HTMLElement): void => {
      delete el.dataset['introAnim'];
    });
  };

  if (!animate || capabilities.reducedMotion || !name || !headline) {
    gsap.set(hidden, { autoAlpha: 1 });
    release();
    return;
  }

  await document.fonts.ready;
  gsap.set(hidden, { autoAlpha: 0 });
  release();

  // Splits stay in place: reverting them repaints the text and would push LCP back.
  const letters: SplitText = SplitText.create(name, {
    type: 'chars',
    mask: 'chars',
    charsClass: 'intro-char',
    aria: 'auto',
  });
  let headlinePlayed: boolean = false;
  SplitText.create(headline, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'intro-line',
    // Line spans read naturally, so no ARIA: `aria-label` is not allowed on a paragraph.
    aria: 'none',
    // Re-split on resize so lines still break correctly. Only the first split animates.
    autoSplit: true,
    onSplit: (self: SplitText): void => {
      if (headlinePlayed) {
        return;
      }
      headlinePlayed = true;
      gsap.from(self.lines, {
        yPercent: 105,
        duration: 0.9,
        stagger: 0.08,
        delay: 0.2,
        ease: 'expo.out',
      });
    },
  });

  gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .set(targets, { autoAlpha: 1 })
    .from(letters.chars, { yPercent: 110, skewY: 12, duration: 0.75, stagger: 0.06 }, 0)
    // The intro text is the page's LCP element; it rises in with the letters, not after.
    .add(revealScene(scene), 0);
}
