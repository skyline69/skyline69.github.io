// ── Capability detection ──

/** What the current browser and user preferences allow. */
export interface Capabilities {
  /** User asked for less motion. Animations become crossfades. */
  reducedMotion: boolean;
  /** A mouse or trackpad is the primary pointer. Cursor effects only run then. */
  finePointer: boolean;
  /** HTML-in-Canvas plus WebGL2 are available, so Canvas UI effects can run. */
  htmlInCanvas: boolean;
}

type PaintableCanvas = HTMLCanvasElement & { requestPaint?: unknown };
type ElementImageContext = CanvasRenderingContext2D & { drawElementImage?: unknown };

/**
 * Same probe Canvas UI uses, repeated here so the vendor code is only downloaded when it can run.
 */
function supportsHtmlInCanvas(): boolean {
  const probe: PaintableCanvas = document.createElement('canvas');
  const context: ElementImageContext | null = probe.getContext('2d');
  if (!context) {
    return false;
  }
  return typeof context.drawElementImage === 'function' && typeof probe.requestPaint === 'function';
}

function supportsWebGl2(): boolean {
  const context: WebGL2RenderingContext | null = document
    .createElement('canvas')
    .getContext('webgl2');
  return context !== null;
}

/**
 * WebGL on a real GPU. OGL leaves `gl` undefined when the browser refuses a context, so
 * callers probe first. Software rendering (no GPU, or a blocklisted one) counts as
 * unsupported: shaders would run on the CPU and stall the page.
 */
export function supportsFastWebGl(): boolean {
  const attributes: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true };
  const probe: HTMLCanvasElement = document.createElement('canvas');
  return (
    probe.getContext('webgl2', attributes) !== null ||
    probe.getContext('webgl', attributes) !== null
  );
}

/**
 * True when the user asked for reduced motion.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Read all capabilities once at startup.
 */
export function detectCapabilities(): Capabilities {
  const reducedMotion: boolean = prefersReducedMotion();
  return {
    reducedMotion,
    finePointer: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    htmlInCanvas: !reducedMotion && supportsHtmlInCanvas() && supportsWebGl2(),
  };
}
