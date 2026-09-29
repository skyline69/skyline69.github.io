import { createShatter, type ShatterInstance } from '../../vendor/canvas-ui/Shatter/ShatterVanilla';
import { mountEffect, type EffectElements, type Mounted } from './mount';

/**
 * Glass shards over the whole stage. Starts flat; the scene transition ramps
 * `baseStrength` up to break the page apart and back down to settle it.
 */
export function mountShatter(host: HTMLElement): Mounted<ShatterInstance> | null {
  return mountEffect(host, (elements: EffectElements): ShatterInstance | null =>
    createShatter(elements, {
      tileSize: 72,
      shards: 0.85,
      lift: 140,
      tilt: 1.6,
      scatter: 60,
      gapColor: [0, 0, 0],
      refraction: 1.1,
      dispersion: 0.4,
      floatSpeed: 0.6,
      strength: 0,
      baseStrength: 0,
    }),
  );
}
