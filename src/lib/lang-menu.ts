import { gsap } from 'gsap';
import { prefersReducedMotion } from './effects/detect';

// ── Language menu: animated popover, keeps the scene when switching language ──

interface LangMenu {
  open: () => void;
  close: (after?: () => void) => void;
}

/**
 * Open and close the <details> with a drop and fade. Opening sets `open` first so the list
 * can animate in; closing animates out first and only then removes `open`. With reduced
 * motion both are a short crossfade.
 */
function createMenu(menu: HTMLDetailsElement, list: HTMLElement): LangMenu {
  const reduced: boolean = prefersReducedMotion();
  const items: HTMLElement[] = [...list.querySelectorAll<HTMLElement>('li')];

  const open = (): void => {
    gsap.killTweensOf([list, ...items]);
    menu.open = true;
    if (reduced) {
      gsap.fromTo(list, { opacity: 0 }, { opacity: 1, duration: 0.15, clearProps: 'all' });
      return;
    }
    gsap.fromTo(
      list,
      { opacity: 0, y: -10, scale: 0.94, transformOrigin: '100% 0%' },
      { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'power3.out', clearProps: 'all' },
    );
    gsap.fromTo(
      items,
      { opacity: 0, y: -6 },
      {
        opacity: 1,
        y: 0,
        duration: 0.28,
        ease: 'power2.out',
        stagger: 0.04,
        delay: 0.05,
        clearProps: 'all',
      },
    );
  };

  const close = (after?: () => void): void => {
    gsap.killTweensOf([list, ...items]);
    gsap.to(list, {
      opacity: 0,
      ...(reduced ? {} : { y: -6, scale: 0.96, transformOrigin: '100% 0%' }),
      duration: reduced ? 0.12 : 0.2,
      ease: 'power2.in',
      onComplete: (): void => {
        menu.open = false;
        gsap.set([list, ...items], { clearProps: 'all' });
        after?.();
      },
    });
  };

  return { open, close };
}

/**
 * Wire up the header language menu. The menu is a native <details>, so it works without
 * JavaScript; this animates it, closes it on an outside press or Escape, and appends the
 * current scene hash to the language links so switching language stays on the same scene.
 */
export function initLangMenu(): void {
  const menu: HTMLDetailsElement | null =
    document.querySelector<HTMLDetailsElement>('[data-lang-menu]');
  const summary: HTMLElement | null = menu?.querySelector('summary') ?? null;
  const list: HTMLElement | null = menu?.querySelector<HTMLElement>('.lang-list') ?? null;
  if (!menu || !summary || !list) {
    return;
  }
  const { open, close }: LangMenu = createMenu(menu, list);

  summary.addEventListener('click', (event: MouseEvent): void => {
    event.preventDefault();
    if (menu.open) {
      close();
    } else {
      open();
    }
  });

  document.addEventListener('pointerdown', (event: PointerEvent): void => {
    if (menu.open && event.target instanceof Node && !menu.contains(event.target)) {
      close();
    }
  });

  menu.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !menu.open) {
      return;
    }
    close((): void => {
      summary.focus();
    });
  });

  menu
    .querySelectorAll<HTMLAnchorElement>('[data-lang-link]')
    .forEach((link: HTMLAnchorElement): void => {
      const base: string = link.getAttribute('href') ?? '/';
      link.addEventListener('click', (): void => {
        link.href = `${base}${window.location.hash}`;
      });
    });
}
