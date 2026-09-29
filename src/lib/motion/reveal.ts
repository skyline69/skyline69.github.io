import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// ── Staggered entrances for scene content ──

const splits: WeakMap<HTMLElement, SplitText> = new WeakMap();

function wordsOf(element: HTMLElement): Element[] {
  const existing: SplitText | undefined = splits.get(element);
  if (existing) {
    return existing.words;
  }
  // Word spans read naturally, so no ARIA: `aria-label` is not allowed on a paragraph.
  const split: SplitText = SplitText.create(element, { type: 'words', aria: 'none' });
  splits.set(element, split);
  return split.words;
}

/**
 * Entrance for a scene: `[data-reveal]` blocks rise in, `[data-reveal-words]` paragraphs
 * come in word by word, `[data-reveal-pop]` tiles pop out from the centre. Returns a timeline so callers can place it inside a transition.
 */
export function revealScene(scene: HTMLElement): gsap.core.Timeline {
  const blocks: HTMLElement[] = gsap.utils.toArray<HTMLElement>('[data-reveal]', scene);
  const paragraphs: HTMLElement[] = gsap.utils.toArray<HTMLElement>('[data-reveal-words]', scene);
  const words: Element[] = paragraphs.flatMap((p: HTMLElement): Element[] => wordsOf(p));
  const pops: HTMLElement[] = gsap.utils.toArray<HTMLElement>('[data-reveal-pop]', scene);

  const timeline: gsap.core.Timeline = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (blocks.length > 0) {
    timeline.fromTo(
      blocks,
      { y: 48, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        stagger: 0.07,
        clearProps: 'transform,opacity,visibility',
      },
      0,
    );
  }
  if (words.length > 0) {
    timeline.fromTo(
      words,
      { yPercent: 60, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.8,
        stagger: 0.012,
        clearProps: 'transform,opacity,visibility',
      },
      0.1,
    );
  }
  if (pops.length > 0) {
    timeline.fromTo(
      pops,
      { scale: 0.4, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 0.9,
        ease: 'back.out(1.6)',
        stagger: { each: 0.045, from: 'center' },
        clearProps: 'transform,opacity,visibility',
      },
      0.05,
    );
  }
  return timeline;
}
