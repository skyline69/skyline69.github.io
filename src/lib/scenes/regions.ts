// ── Wipe regions: which slanted band of a scene is visible (pure) ──

/**
 * Visible part of a scene: the band between a slanted left edge and a slanted right edge,
 * as x positions (percent of the scene width) at the top and bottom.
 */
export interface Region {
  lt: number;
  lb: number;
  rt: number;
  rb: number;
}

/** Off-screen on both sides, with the same tilt the wipe edges use. */
export const FULL: Readonly<Region> = { lt: -40, lb: -30, rt: 140, rb: 130 };

/**
 * Grow a region off-screen on both sides while each edge keeps its current tilt, so a
 * scene gliding back never straightens its edge mid-way.
 */
export function fullFrom(region: Region): Region {
  return {
    lt: FULL.lt,
    lb: FULL.lt + (region.lb - region.lt),
    rt: FULL.rt,
    rb: FULL.rt + (region.rb - region.rt),
  };
}

/**
 * Horizontal middle of a region.
 */
export function centreOf(region: Region): number {
  return (region.lt + region.lb + region.rt + region.rb) / 4;
}

/**
 * Region a leaving scene keeps while `incoming` grows: it is cut back to its side of the
 * incoming edge, so the two never overlap. `onLeft` says which side that is.
 *
 * Once the edge has swept past the whole scene the region collapses to zero width. It must
 * never invert (right edge left of the left edge): a polygon is filled whichever way its
 * points run, so an inverted region would paint the scene across the screen.
 */
export function complement(base: Region, incoming: Region, onLeft: boolean): Region {
  if (onLeft) {
    return {
      ...base,
      rt: Math.max(base.lt, Math.min(base.rt, incoming.lt)),
      rb: Math.max(base.lb, Math.min(base.rb, incoming.lb)),
    };
  }
  return {
    ...base,
    lt: Math.min(base.rt, Math.max(base.lt, incoming.rt)),
    lb: Math.min(base.rb, Math.max(base.lb, incoming.rb)),
  };
}

/**
 * CSS `clip-path` for a region.
 */
export function clipPathOf(region: Region): string {
  return `polygon(${region.lt}% 0%, ${region.rt}% 0%, ${region.rb}% 100%, ${region.lb}% 100%)`;
}
