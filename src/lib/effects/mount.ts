// ── Canvas UI mounting: move live HTML into a layoutsubtree canvas and back ──

/** The three elements every Canvas UI effect is created from. */
export interface EffectElements {
  source: HTMLCanvasElement;
  content: HTMLElement;
  output: HTMLCanvasElement;
}

interface Destroyable {
  destroy: () => void;
}

/** A running effect plus the function that tears it down and restores the DOM. */
export interface Mounted<T> {
  readonly instance: T;
  unmount: () => void;
}

/**
 * Wrap the `[data-effect-content]` child of `host` in a Canvas UI effect.
 * The host must have a size that does not depend on its content, because the content
 * leaves the normal flow while the effect runs. Returns null when the effect cannot start;
 * the DOM is then left exactly as it was.
 */
export function mountEffect<T extends Destroyable>(
  host: HTMLElement,
  create: (elements: EffectElements) => T | null,
): Mounted<T> | null {
  const content: HTMLElement | null = host.querySelector<HTMLElement>(
    ':scope > [data-effect-content]',
  );
  if (!content) {
    return null;
  }

  const source: HTMLCanvasElement = document.createElement('canvas');
  source.setAttribute('layoutsubtree', 'true');
  source.className = 'effect-source';

  const output: HTMLCanvasElement = document.createElement('canvas');
  output.className = 'effect-output';
  output.setAttribute('aria-hidden', 'true');

  host.classList.add('effect-host');
  content.before(source);
  source.append(content);
  host.append(output);

  const restore = (): void => {
    source.before(content);
    source.remove();
    output.remove();
    host.classList.remove('effect-host');
  };

  const instance: T | null = create({ source, content, output });
  if (!instance) {
    restore();
    return null;
  }

  return {
    instance,
    unmount: (): void => {
      instance.destroy();
      restore();
    },
  };
}
