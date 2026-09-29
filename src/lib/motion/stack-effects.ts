import { gsap } from 'gsap';

// ── Stack visuals: link arcs, tilt, spotlight and idle float ──

/** Largest tilt of a hovered tile, in degrees. */
const TILT_MAX: number = 16;

const SVG_NS = 'http://www.w3.org/2000/svg' as const;

/** How far link arcs bow out, as a share of their length. */
const ARC_LIFT: number = 0.32;

interface Point {
  x: number;
  y: number;
}

function centreOf(tile: HTMLElement, origin: DOMRect): Point {
  const rect: DOMRect = tile.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - origin.left,
    y: rect.top + rect.height / 2 - origin.top,
  };
}

/**
 * Control point for a link arc: the midpoint pushed sideways, always bowing upward,
 * so links curve over the tiles in between instead of cutting through them.
 */
function arcControl(from: Point, to: Point): Point {
  const dx: number = to.x - from.x;
  const dy: number = to.y - from.y;
  let nx: number = -dy;
  let ny: number = dx;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const length: number = Math.hypot(nx, ny) || 1;
  const lift: number = Math.hypot(dx, dy) * ARC_LIFT;
  return {
    x: (from.x + to.x) / 2 + (nx / length) * lift,
    y: (from.y + to.y) / 2 + (ny / length) * lift,
  };
}

/**
 * Draw an arc from the active tile to each related tile, growing out from the active one.
 */
export function drawLinks(
  svg: SVGSVGElement,
  field: HTMLElement,
  active: HTMLElement,
  related: readonly HTMLElement[],
  animate: boolean,
): void {
  svg.replaceChildren();
  const origin: DOMRect = field.getBoundingClientRect();
  const from: Point = centreOf(active, origin);

  const lines: SVGPathElement[] = related.map((tile: HTMLElement): SVGPathElement => {
    const to: Point = centreOf(tile, origin);
    const bend: Point = arcControl(from, to);
    const path: SVGPathElement = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', `M ${from.x} ${from.y} Q ${bend.x} ${bend.y} ${to.x} ${to.y}`);
    svg.append(path);
    const length: number = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = animate ? String(length) : '0';
    return path;
  });

  if (animate && lines.length > 0) {
    gsap.to(lines, { strokeDashoffset: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 });
  }
}

/**
 * Tilt the hovered tile toward the cursor.
 */
export function bindTilt(tiles: readonly HTMLElement[]): void {
  tiles.forEach((tile: HTMLElement): void => {
    const face: HTMLElement | null = tile.querySelector<HTMLElement>('[data-hex-face]');
    const target: HTMLElement = face ?? tile;
    const rotateX: gsap.QuickToFunc = gsap.quickTo(target, 'rotationX', {
      duration: 0.5,
      ease: 'power3.out',
    });
    const rotateY: gsap.QuickToFunc = gsap.quickTo(target, 'rotationY', {
      duration: 0.5,
      ease: 'power3.out',
    });

    tile.addEventListener('pointermove', (event: PointerEvent): void => {
      const rect: DOMRect = tile.getBoundingClientRect();
      const px: number = (event.clientX - rect.left) / rect.width - 0.5;
      const py: number = (event.clientY - rect.top) / rect.height - 0.5;
      rotateX(-py * TILT_MAX * 2);
      rotateY(px * TILT_MAX * 2);
    });
    tile.addEventListener('pointerenter', (): void => {
      gsap.to(target, { scale: 1.08, duration: 0.4, ease: 'back.out(2)' });
    });
    tile.addEventListener('pointerleave', (): void => {
      rotateX(0);
      rotateY(0);
      gsap.to(target, { scale: 1, duration: 0.5, ease: 'power3.out' });
    });
  });
}

/**
 * A soft purple light that trails the cursor across the field.
 */
export function bindSpotlight(field: HTMLElement, spot: HTMLElement): void {
  const moveX: gsap.QuickToFunc = gsap.quickTo(spot, 'x', { duration: 0.8, ease: 'power3.out' });
  const moveY: gsap.QuickToFunc = gsap.quickTo(spot, 'y', { duration: 0.8, ease: 'power3.out' });
  field.addEventListener('pointerenter', (event: PointerEvent): void => {
    const rect: DOMRect = field.getBoundingClientRect();
    gsap.set(spot, { x: event.clientX - rect.left, y: event.clientY - rect.top });
    gsap.to(spot, { opacity: 1, duration: 0.6 });
  });
  field.addEventListener('pointermove', (event: PointerEvent): void => {
    const rect: DOMRect = field.getBoundingClientRect();
    moveX(event.clientX - rect.left);
    moveY(event.clientY - rect.top);
  });
  field.addEventListener('pointerleave', (): void => {
    gsap.to(spot, { opacity: 0, duration: 0.6 });
  });
}

/**
 * Each tile bobs on its own slow rhythm. Returns the tweens so they can pause off screen.
 */
export function createFloat(tiles: readonly HTMLElement[]): gsap.core.Tween[] {
  return tiles.map((tile: HTMLElement): gsap.core.Tween =>
    gsap.to(tile, {
      y: gsap.utils.random(-9, -4),
      duration: gsap.utils.random(2.4, 4),
      delay: gsap.utils.random(0, 2),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      paused: true,
    }),
  );
}

/**
 * Fade the link arcs out, then remove them unless a new selection drew fresh ones.
 */
export function clearLinks(svg: SVGSVGElement, animate: boolean, stillIdle: () => boolean): void {
  // GSAP warns about empty targets, and there is nothing to fade anyway.
  const links: Element[] = [...svg.children];
  if (links.length === 0) {
    return;
  }
  gsap.to(links, {
    opacity: 0,
    duration: animate ? 0.3 : 0,
    onComplete: (): void => {
      if (stillIdle()) {
        svg.replaceChildren();
      }
    },
  });
}
