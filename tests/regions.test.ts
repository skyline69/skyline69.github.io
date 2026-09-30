import { describe, expect, test } from 'bun:test';
import { FULL, complement, type Region } from '../src/lib/scenes/regions';

/**
 * A polygon is filled whichever way its points run, so a region whose right edge sits left
 * of its left edge (at the top or the bottom) paints the span between them instead of
 * nothing.
 */
function isInverted(region: Region): boolean {
  return region.rt < region.lt || region.rb < region.lb;
}

/** An incoming scene whose left edge sits at `x`. */
function incomingAt(x: number): Region {
  return { lt: x, lb: x + 10, rt: x + 20, rb: x + 20 };
}

describe('complement', () => {
  test('cuts a leaving scene back to its side of the incoming edge', () => {
    expect(complement({ ...FULL }, incomingAt(50), true)).toEqual({ ...FULL, rt: 50, rb: 60 });
    expect(complement({ ...FULL }, incomingAt(50), false)).toEqual({ ...FULL, lt: 70, lb: 70 });
  });

  test('collapses to zero width, never inverts, once the edge passes the whole scene', () => {
    // The leaving scene only covers the right part of the screen; the incoming edge from
    // the right has already swept past all of it.
    const rightPart: Region = { lt: 60, lb: 70, rt: 140, rb: 130 };
    const swept: Region = complement(rightPart, incomingAt(-30), true);
    expect(isInverted(swept)).toBe(false);
    expect(swept.rt - swept.lt).toBe(0);
    expect(swept.rb - swept.lb).toBe(0);

    // The same from the other side: a scene on the left, the edge from the left gone past.
    const leftPart: Region = { lt: -40, lb: -30, rt: 20, rb: 10 };
    const sweptBack: Region = complement(leftPart, { lt: -35, lb: -35, rt: 130, rb: 120 }, false);
    expect(isInverted(sweptBack)).toBe(false);
  });

  test('never inverts for any edge position', () => {
    const bases: Region[] = [
      { ...FULL },
      { lt: 60, lb: 70, rt: 140, rb: 130 },
      { lt: -40, lb: -30, rt: 20, rb: 10 },
      { lt: 10, lb: 30, rt: 40, rb: 35 },
    ];
    for (const base of bases) {
      for (let x: number = -60; x <= 160; x += 5) {
        for (const onLeft of [true, false]) {
          expect(isInverted(complement(base, incomingAt(x), onLeft))).toBe(false);
        }
      }
    }
  });
});
