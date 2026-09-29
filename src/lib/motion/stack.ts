import { gsap } from 'gsap';
import type { Capabilities } from '../effects/detect';
import { bindSpotlight, bindTilt, clearLinks, createFloat, drawLinks } from './stack-effects';

// ── Stack scene: floating hex tiles, cursor tilt, spotlight, glowing links between tools ──

type TileState = 'idle' | 'active' | 'related' | 'dim';

export interface Stack {
  /** Run the idle float only while the scene is on screen. */
  setVisible: (visible: boolean) => void;
}

/** Grace period before leaving the tiles resets the stack, so gaps between tiles do not flicker. */
const LEAVE_DELAY: number = 0.12;

/**
 * Keyboard focus or a tap selects a tile.
 */
function bindSelection(
  tiles: readonly HTMLButtonElement[],
  select: (tile: HTMLButtonElement) => void,
): void {
  tiles.forEach((tile: HTMLButtonElement): void => {
    tile.addEventListener('focus', (): void => {
      select(tile);
    });
    tile.addEventListener('click', (): void => {
      select(tile);
    });
  });
}

/**
 * Mark `tile` active, the tools it ships with related and the rest dim.
 * Returns the related tiles.
 */
function applyStates(
  tiles: readonly HTMLButtonElement[],
  tile: HTMLButtonElement,
): HTMLButtonElement[] {
  const name: string = tile.dataset['name'] ?? '';
  const related: Set<string> = new Set((tile.dataset['related'] ?? '').split(',').filter(Boolean));
  const relatedTiles: HTMLButtonElement[] = [];
  tiles.forEach((other: HTMLButtonElement): void => {
    const otherName: string = other.dataset['name'] ?? '';
    let state: TileState = 'dim';
    if (otherName === name) {
      state = 'active';
    } else if (related.has(otherName)) {
      state = 'related';
      relatedTiles.push(other);
    }
    other.dataset['state'] = state;
    other.setAttribute('aria-pressed', String(state === 'active'));
  });
  return relatedTiles;
}

/**
 * Mouse hover by hit-testing every move: the tile under the pointer (hexagon shape, thanks
 * to clip-path) is selected; anywhere else resets after a short grace period. Leaving the
 * scene or the window resets at once, so no state can outlive the pointer.
 */
function bindHover(
  scene: HTMLElement,
  isCurrent: (tile: HTMLButtonElement) => boolean,
  select: (tile: HTMLButtonElement) => void,
  reset: () => void,
): void {
  let pending: gsap.core.Tween | null = null;
  const cancel = (): void => {
    pending?.kill();
    pending = null;
  };
  const resetNow = (): void => {
    cancel();
    reset();
  };

  scene.addEventListener('pointermove', (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    const tile: HTMLButtonElement | null =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('[data-stack-tile]')
        : null;
    if (tile) {
      cancel();
      if (!isCurrent(tile)) {
        select(tile);
      }
      return;
    }
    pending ??= gsap.delayedCall(LEAVE_DELAY, (): void => {
      pending = null;
      reset();
    });
  });
  scene.addEventListener('pointerleave', resetNow);
  document.documentElement.addEventListener('mouseleave', resetNow);
  window.addEventListener('blur', resetNow);
}

/**
 * Return to the calm state when keyboard focus leaves the tiles or a tap lands outside them.
 */
function bindReset(scene: HTMLElement, field: HTMLElement, reset: () => void): void {
  field.addEventListener('focusout', (event: FocusEvent): void => {
    if (!(event.relatedTarget instanceof Node) || !field.contains(event.relatedTarget)) {
      reset();
    }
  });
  scene.addEventListener('click', (event: MouseEvent): void => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-stack-tile]')) {
      reset();
    }
  });
}

/**
 * Wire up the stack: hover, focus or tap a tile to show where the tool is used.
 * With nothing selected every tile rests in the same calm state.
 */
export function initStack(scene: HTMLElement, capabilities: Capabilities): Stack | null {
  const field: HTMLElement | null = scene.querySelector<HTMLElement>('[data-stack-field]');
  const svg: SVGSVGElement | null = scene.querySelector<SVGSVGElement>('[data-stack-links]');
  const spot: HTMLElement | null = scene.querySelector<HTMLElement>('[data-stack-spot]');
  const tiles: HTMLButtonElement[] = gsap.utils.toArray<HTMLButtonElement>(
    '[data-stack-tile]',
    scene,
  );
  const detail: HTMLElement | null = scene.querySelector<HTMLElement>('[data-stack-detail]');
  const nameOut: HTMLElement | null = scene.querySelector<HTMLElement>('[data-stack-name]');
  const textOut: HTMLElement | null = scene.querySelector<HTMLElement>('[data-stack-text]');
  if (!field || !svg || tiles.length === 0 || !detail || !nameOut || !textOut) {
    return null;
  }

  const animate: boolean = !capabilities.reducedMotion;
  let current: HTMLButtonElement | undefined;

  const activate = (tile: HTMLButtonElement, withMotion: boolean): void => {
    current = tile;
    const relatedTiles: HTMLButtonElement[] = applyStates(tiles, tile);
    nameOut.textContent = tile.dataset['name'] ?? '';
    textOut.textContent = tile.dataset['usedIn'] ?? '';
    detail.classList.add('is-visible');
    drawLinks(svg, field, tile, relatedTiles, withMotion && animate);
  };

  const reset = (): void => {
    if (!current) {
      return;
    }
    current = undefined;
    tiles.forEach((tile: HTMLButtonElement): void => {
      tile.dataset['state'] = 'idle';
      tile.setAttribute('aria-pressed', 'false');
    });
    detail.classList.remove('is-visible');
    clearLinks(svg, animate, (): boolean => current === undefined);
  };

  const select = (tile: HTMLButtonElement): void => {
    activate(tile, true);
  };
  bindSelection(tiles, select);
  bindHover(scene, (tile: HTMLButtonElement): boolean => tile === current, select, reset);
  bindReset(scene, field, reset);

  window.addEventListener('resize', (): void => {
    if (current) {
      activate(current, false);
    }
  });

  if (animate && capabilities.finePointer) {
    bindTilt(tiles);
    if (spot) {
      bindSpotlight(field, spot);
    }
  }
  const floats: gsap.core.Tween[] = animate ? createFloat(tiles) : [];

  return {
    setVisible: (visible: boolean): void => {
      floats.forEach((tween: gsap.core.Tween): void => {
        if (visible) {
          tween.play();
        } else {
          tween.pause();
        }
      });
      if (!visible) {
        reset();
      }
    },
  };
}
