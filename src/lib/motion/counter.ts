import { gsap } from 'gsap';
import { pad2 } from '../scenes/state';

// ── Header counter: digits roll like an odometer when the scene changes ──

export interface Counter {
  /** Show a scene position (zero-based). Only digits that change roll. */
  set: (index: number) => void;
}

const DURATION: number = 0.6;
const EASE: string = 'power3.out';

function glyph(char: string): HTMLSpanElement {
  const span: HTMLSpanElement = document.createElement('span');
  span.className = 'counter-glyph';
  span.textContent = char;
  return span;
}

/**
 * One digit's window. A zero-width strut keeps the line height while every glyph floats
 * during a roll.
 */
function digitWindow(char: string): HTMLSpanElement {
  const window: HTMLSpanElement = document.createElement('span');
  const strut: HTMLSpanElement = document.createElement('span');
  strut.textContent = '\u200B';
  window.className = 'counter-digit';
  window.append(strut, glyph(char));
  return window;
}

/** A width in em, so it stays right when the header font size follows the viewport. */
function toEm(window: HTMLElement, px: number): string {
  return `${px / Number(getComputedStyle(window).fontSize.replace('px', ''))}em`;
}

/**
 * Put a window back at rest once a roll has finished: only the shown glyph, in the flow.
 */
function rest(window: HTMLElement): void {
  window
    .querySelectorAll<HTMLElement>('.counter-glyph.is-leaving')
    .forEach((leftover: HTMLElement): void => {
      gsap.killTweensOf(leftover);
      leftover.remove();
    });
  const shown: HTMLElement | null = window.querySelector<HTMLElement>('.counter-glyph');
  shown?.classList.remove('counter-glyph--float');
  gsap.set([window, shown], { clearProps: 'all' });
}

/**
 * Roll one digit to a new character. Moving forward the old digit leaves upwards and the
 * new one rises from below; moving back it runs the other way. Reduced motion crossfades.
 *
 * A roll can start while another is still running: every glyph carries on from where it
 * is, and a glyph that is still on its way out rolls back in instead of being duplicated.
 * The font has no tabular figures ("1" is much narrower than "2"), so the window's width
 * eases between glyphs rather than jumping.
 */
function roll(window: HTMLElement, char: string, direction: 1 | -1, reducedMotion: boolean): void {
  const shift: number = reducedMotion ? 0 : 100 * direction;
  const duration: number = reducedMotion ? 0.25 : DURATION;
  const glyphs: HTMLElement[] = [...window.querySelectorAll<HTMLElement>('.counter-glyph')];
  const current: HTMLElement | undefined = glyphs.find(
    (g: HTMLElement): boolean => !g.classList.contains('is-leaving'),
  );

  if (window.style.width === '') {
    gsap.set(window, { width: toEm(window, current?.offsetWidth ?? 0) });
  }
  glyphs.forEach((g: HTMLElement): void => {
    g.classList.add('counter-glyph--float');
  });

  if (current) {
    current.classList.add('is-leaving');
    gsap.to(current, {
      yPercent: -shift,
      opacity: 0,
      duration,
      ease: EASE,
      overwrite: true,
      onComplete: (): void => {
        current.remove();
      },
    });
  }

  const returning: HTMLElement | undefined = glyphs.findLast(
    (g: HTMLElement): boolean => g !== current && g.textContent === char,
  );
  const incoming: HTMLElement = returning ?? glyph(char);
  if (!returning) {
    incoming.classList.add('counter-glyph--float');
    window.append(incoming);
    gsap.set(incoming, { yPercent: shift, opacity: 0 });
  }
  incoming.classList.remove('is-leaving');
  gsap.to(incoming, { yPercent: 0, opacity: 1, duration, ease: EASE, overwrite: true });
  gsap.to(window, {
    width: toEm(window, incoming.offsetWidth),
    duration,
    ease: EASE,
    overwrite: true,
    onComplete: (): void => {
      rest(window);
    },
  });
}

/**
 * Turn the `[data-counter]` text into rolling digits, starting at `initial` of `total`.
 */
export function createCounter(
  element: HTMLElement,
  initial: number,
  total: number,
  reducedMotion: boolean,
): Counter {
  let shown: number = initial;
  let text: string = pad2(initial + 1);
  const windows: HTMLSpanElement[] = text
    .split('')
    .map((char: string): HTMLSpanElement => digitWindow(char));
  element.replaceChildren(...windows, ` / ${pad2(total)}`);

  return {
    set: (index: number): void => {
      if (index === shown) {
        return;
      }
      const direction: 1 | -1 = index > shown ? 1 : -1;
      const next: string = pad2(index + 1);
      windows.forEach((window: HTMLSpanElement, i: number): void => {
        const char: string = next.charAt(i);
        if (char !== text.charAt(i)) {
          roll(window, char, direction, reducedMotion);
        }
      });
      shown = index;
      text = next;
    },
  };
}
