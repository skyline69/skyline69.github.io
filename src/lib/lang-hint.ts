import { gsap } from 'gsap';
import { prefersReducedMotion } from './effects/detect';
import { isLocale, preferredLocale, type Locale } from './i18n';

// ── Language hint: suggest the reader's own language, remember their answer ──

const CHOICE_KEY: string = 'lang-choice';

/** Let the intro settle before anything else asks for attention. */
const SHOW_DELAY_S: number = 1.6;

/**
 * Remember that the reader has settled on a language (picked one, followed the hint or
 * dismissed it), so the hint never comes back.
 */
export function rememberLocale(locale: Locale): void {
  localStorage.setItem(CHOICE_KEY, locale);
}

function hasChosen(): boolean {
  return localStorage.getItem(CHOICE_KEY) !== null;
}

function show(hint: HTMLElement, reduced: boolean): void {
  hint.hidden = false;
  gsap.fromTo(
    hint,
    { autoAlpha: 0, y: reduced ? 0 : -12 },
    { autoAlpha: 1, y: 0, duration: reduced ? 0.3 : 0.6, ease: 'expo.out', delay: SHOW_DELAY_S },
  );
}

function hide(hint: HTMLElement, reduced: boolean): void {
  gsap.to(hint, {
    autoAlpha: 0,
    y: reduced ? 0 : -8,
    duration: reduced ? 0.2 : 0.3,
    ease: 'power2.in',
    overwrite: true,
    onComplete: (): void => {
      hint.hidden = true;
    },
  });
}

/**
 * Show the hint for the reader's preferred language when this page is in another one and
 * they have not settled on a language yet.
 */
export function initLangHint(): void {
  const current: string = document.documentElement.lang;
  const preferred: Locale | null = preferredLocale(navigator.languages);
  if (!isLocale(current) || preferred === null || preferred === current || hasChosen()) {
    return;
  }
  const hint: HTMLElement | null = document.querySelector<HTMLElement>(
    `[data-lang-hint="${preferred}"]`,
  );
  const go: HTMLAnchorElement | null =
    hint?.querySelector<HTMLAnchorElement>('[data-lang-hint-go]') ?? null;
  const close: HTMLButtonElement | null =
    hint?.querySelector<HTMLButtonElement>('[data-lang-hint-close]') ?? null;
  if (!hint || !go || !close) {
    return;
  }
  const reduced: boolean = prefersReducedMotion();

  const base: string = go.getAttribute('href') ?? '/';
  go.addEventListener('click', (): void => {
    rememberLocale(preferred);
    // Stay on the same scene in the other language.
    go.href = `${base}${window.location.hash}`;
  });
  close.addEventListener('click', (): void => {
    rememberLocale(current);
    hide(hint, reduced);
  });
  show(hint, reduced);
}
