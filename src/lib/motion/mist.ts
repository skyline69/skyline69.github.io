import { gsap } from 'gsap';
import type { SceneId } from '../scenes/state';

// ── Background mist: three blurred blobs that drift to new spots per scene ──

/** Blob centre in viewport units. */
type Spot = readonly [x: number, y: number];

const SPOTS: Readonly<Record<SceneId, readonly [Spot, Spot, Spot]>> = {
  intro: [
    [-8, 62],
    [78, -8],
    [88, 88],
  ],
  work: [
    [62, 70],
    [-10, -12],
    [95, 20],
  ],
  stack: [
    [45, 42],
    [95, 95],
    [-12, 80],
  ],
  me: [
    [-10, -10],
    [85, 85],
    [48, 105],
  ],
};

export interface Mist {
  moveTo: (id: SceneId) => void;
}

/**
 * Place the blobs for the first scene and return a mover for later scenes.
 */
export function createMist(stage: HTMLElement, initial: SceneId, reducedMotion: boolean): Mist {
  const blobs: HTMLElement[] = gsap.utils.toArray<HTMLElement>('[data-mist]', stage);

  const place = (id: SceneId, duration: number): void => {
    blobs.forEach((blob: HTMLElement, i: number): void => {
      const spot: Spot | undefined = SPOTS[id][i];
      if (!spot) {
        return;
      }
      gsap.to(blob, {
        left: `${spot[0]}vw`,
        top: `${spot[1]}vh`,
        duration,
        ease: 'expo.inOut',
        overwrite: 'auto',
      });
    });
  };

  place(initial, 0);

  if (!reducedMotion) {
    blobs.forEach((blob: HTMLElement, i: number): void => {
      gsap.to(blob, {
        scale: 1.18,
        rotation: i % 2 === 0 ? 12 : -12,
        duration: 7 + i * 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });
  }

  return {
    moveTo: (id: SceneId): void => {
      place(id, reducedMotion ? 0 : 1.8);
    },
  };
}
