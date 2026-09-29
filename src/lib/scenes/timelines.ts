import { gsap } from 'gsap';
import type { Direction, Transition, TransitionRun, TransitionScenes } from './controller';
import { revealScene } from '../motion/reveal';

// ── Scene transitions: GSAP fallbacks that run everywhere ──

/**
 * Visible part of a scene: the band between a slanted left edge and a slanted right edge,
 * as x positions (percent of the scene width) at the top and bottom.
 */
interface Region {
  lt: number;
  lb: number;
  rt: number;
  rb: number;
}

/** Off-screen on both sides, with the same tilt the wipe edges use. */
const FULL: Readonly<Region> = { lt: -40, lb: -30, rt: 140, rb: 130 };

/**
 * Grow a region off-screen on both sides while each edge keeps its current tilt, so a
 * scene gliding back never straightens its edge mid-way.
 */
function fullFrom(region: Region): Region {
  return {
    lt: FULL.lt,
    lb: FULL.lt + (region.lb - region.lt),
    rt: FULL.rt,
    rb: FULL.rt + (region.rb - region.rt),
  };
}

/** Current region of every clipped scene, so an interrupted wipe can hand off exactly. */
const regions: WeakMap<HTMLElement, Region> = new WeakMap();

/** Each incoming scene stacks above everything still on screen. */
let layer: number = 2;

function regionOf(scene: HTMLElement): Region {
  return regions.get(scene) ?? { ...FULL };
}

function centreOf(region: Region): number {
  return (region.lt + region.lb + region.rt + region.rb) / 4;
}

function applyRegion(scene: HTMLElement, region: Region): void {
  regions.set(scene, region);
  scene.style.clipPath = `polygon(${region.lt}% 0%, ${region.rt}% 0%, ${region.rb}% 100%, ${region.lb}% 100%)`;
}

/**
 * Region a leaving scene keeps while `incoming` grows: it is cut back to its side of the
 * incoming edge, so the two never overlap. `onLeft` says which side that is.
 */
function complement(base: Region, incoming: Region, onLeft: boolean): Region {
  if (onLeft) {
    return { ...base, rt: Math.min(base.rt, incoming.lt), rb: Math.min(base.rb, incoming.lb) };
  }
  return { ...base, lt: Math.max(base.lt, incoming.rt), lb: Math.max(base.lb, incoming.rb) };
}

/** Seam height relative to the scene it rides (see `.wipe-seam` in Stage.astro). */
const SEAM_SPAN: number = 1.24;

/**
 * The blurred band that rides the moving edge. Sits over the scene boundary (top and
 * bottom x in percent) and is strongest mid-wipe.
 */
function placeSeam(top: number, bottom: number, progress: number): void {
  const seam: HTMLElement | null = document.querySelector<HTMLElement>('[data-wipe-seam]');
  const stage: HTMLElement | null | undefined = seam?.parentElement;
  if (!seam || !stage) {
    return;
  }
  const width: number = stage.clientWidth;
  // The seam overhangs the scene it rides by 12% above and below.
  const height: number = Math.max(1, seam.offsetHeight / SEAM_SPAN);
  const slant: number = Math.atan((((bottom - top) / 100) * width) / height);
  gsap.set(seam, {
    x: (((top + bottom) / 2) * width) / 100,
    skewX: (slant * 180) / Math.PI,
    autoAlpha: Math.sin(Math.PI * gsap.utils.clamp(0, 1, progress)) ** 0.7,
  });
}

/**
 * Wait for a GSAP animation to finish.
 */
export function finished(animation: gsap.core.Animation): Promise<void> {
  return new Promise<void>((resolve: () => void): void => {
    animation.eventCallback('onComplete', resolve);
  });
}

/**
 * Wrap a transition timeline. On completion the scenes get their inline styles cleared;
 * on cancel the timeline simply stops, leaving every scene exactly where it was.
 */
function runOf(timeline: gsap.core.Timeline, scenes: TransitionScenes): TransitionRun {
  const done: PromiseWithResolvers<boolean> = Promise.withResolvers<boolean>();
  timeline.eventCallback('onComplete', (): void => {
    const all: HTMLElement[] = [...scenes.leaving, scenes.to];
    all.forEach((scene: HTMLElement): void => {
      regions.delete(scene);
    });
    gsap.set(all, { clearProps: 'all' });
    placeSeam(0, 0, 0);
    layer = 2;
    done.resolve(true);
  });
  return {
    finished: done.promise,
    cancel: (): void => {
      timeline.kill();
      done.resolve(false);
    },
  };
}

/**
 * Plain crossfade for reduced motion. Fades from whatever opacity each scene has.
 */
export const crossfade: Transition = (scenes: TransitionScenes): TransitionRun => {
  const { leaving, to, resuming }: TransitionScenes = scenes;
  layer += 1;
  if (!resuming) {
    gsap.set(to, { autoAlpha: 0 });
  }
  const timeline: gsap.core.Timeline = gsap
    .timeline({ defaults: { duration: 0.2, ease: 'none' } })
    .set(to, { zIndex: layer })
    .to(to, { autoAlpha: 1 }, 0);
  if (leaving.length > 0) {
    timeline.to(leaving, { autoAlpha: 0, overwrite: 'auto' }, 0);
  }
  return runOf(timeline, scenes);
};

/** Where the incoming scene starts and ends for a fresh wipe in `direction`. */
function wipeEnds(direction: Direction): { start: Region; end: Region } {
  return direction === 1
    ? { start: { lt: 115, lb: 125, rt: 135, rb: 135 }, end: { lt: -30, lb: -20, rt: 135, rb: 135 } }
    : {
        start: { lt: -35, lb: -35, rt: -15, rb: -25 },
        end: { lt: -35, lb: -35, rt: 130, rb: 120 },
      };
}

/**
 * Split wipe: one slanted edge sweeps across the stage with a blurred band riding on it.
 * The new scene shows on one side, the scenes it replaces only on the other, so their
 * content never overlaps. A scene still partly on screen (going back mid-wipe) grows from
 * the region it already has.
 */
export const wipe: Transition = (scenes: TransitionScenes): TransitionRun => {
  const { leaving, to, direction, resuming }: TransitionScenes = scenes;
  const fresh: { start: Region; end: Region } = wipeEnds(direction);
  const edge: Region = resuming ? regionOf(to) : fresh.start;
  const end: Region = resuming ? fullFrom(edge) : fresh.end;
  const bases: { scene: HTMLElement; base: Region }[] = leaving.map(
    (scene: HTMLElement): { scene: HTMLElement; base: Region } => ({
      scene,
      base: regionOf(scene),
    }),
  );
  let sweep: gsap.core.Tween | null = null;

  const update = (): void => {
    const current: Region = { ...edge };
    applyRegion(to, current);
    bases.forEach(({ scene, base }: { scene: HTMLElement; base: Region }): void => {
      // A fresh wipe knows the side from its direction (centres can tie right after a
      // quick hand-off); a scene gliding back splits the others by position.
      const onLeft: boolean = resuming ? centreOf(base) < centreOf(current) : direction === 1;
      applyRegion(scene, complement(base, current, onLeft));
    });
    // The boundary with the scenes being replaced is the edge facing them.
    const progress: number = sweep?.progress() ?? 0;
    if (direction === 1) {
      placeSeam(current.lt, current.lb, progress);
    } else {
      placeSeam(current.rt, current.rb, progress);
    }
  };

  layer += 1;
  gsap.set(to, { zIndex: layer, xPercent: 0 });
  update();
  if (!resuming) {
    gsap.set(to, { autoAlpha: 1 });
    revealScene(to).delay(0.45);
  }

  sweep = gsap.to(edge, {
    ...end,
    duration: resuming ? 0.7 : 0.9,
    ease: resuming ? 'power3.out' : 'expo.inOut',
    onUpdate: update,
  });
  const timeline: gsap.core.Timeline = gsap.timeline().add(sweep, 0);
  if (resuming) {
    timeline.to(to, { autoAlpha: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' }, 0);
  }
  if (leaving.length > 0) {
    // The old side darkens as it is swept away.
    timeline.to(
      leaving,
      { autoAlpha: 0.45, duration: 0.9, ease: 'power2.in', overwrite: 'auto' },
      0,
    );
  }
  return runOf(timeline, scenes);
};
