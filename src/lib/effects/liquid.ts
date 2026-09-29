import { createLiquid, type LiquidInstance } from '../../vendor/canvas-ui/Liquid/LiquidVanilla';
import { mountEffect, type EffectElements, type Mounted } from './mount';

/**
 * Violet fluid over the Work image frame. Image swaps inject a splat.
 */
export function mountLiquid(host: HTMLElement): Mounted<LiquidInstance> | null {
  return mountEffect(host, (elements: EffectElements): LiquidInstance | null =>
    createLiquid(elements, {
      color: [0.56, 0.02, 0.76],
      intensity: 0.5,
      distortion: 0.9,
      blend: 0.25,
      curl: 18,
      densityDissipation: 0.97,
      velocityDissipation: 0.98,
    }),
  );
}
