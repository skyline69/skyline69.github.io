import type { Direction } from './controller';

// ── Input helpers for the scene controller ──

/**
 * True when `target` sits inside a scrollable area of the scene that can still scroll
 * in `direction`. Small screens scroll inside a scene before the stage moves on.
 */
export function canScrollWithin(
  target: EventTarget | null,
  scene: HTMLElement,
  direction: Direction,
): boolean {
  let node: Element | null = target instanceof Element ? target : null;
  while (node && node !== scene.parentElement) {
    if (node instanceof HTMLElement && node.scrollHeight > node.clientHeight + 1) {
      const overflow: string = getComputedStyle(node).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') {
        const atTop: boolean = node.scrollTop <= 0;
        const atBottom: boolean = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
        if ((direction === 1 && !atBottom) || (direction === -1 && !atTop)) {
          return true;
        }
      }
    }
    node = node.parentElement;
  }
  return false;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}
