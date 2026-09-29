import { describe, expect, test } from 'bun:test';
import { createFrameBudget, type FrameBudget } from '../src/lib/motion/frame-budget';

const options = { warmup: 2, window: 3, limitMs: 40 };

function feed(budget: FrameBudget, frames: readonly number[]): boolean[] {
  return frames.map((ms: number): boolean => budget.sample(ms));
}

describe('createFrameBudget', () => {
  test('ignores slow warm-up frames', () => {
    expect(feed(createFrameBudget(options), [500, 500, 16, 16, 16])).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  test('reports a slow window once it is full', () => {
    expect(feed(createFrameBudget(options), [16, 16, 60, 60, 60])).toEqual([
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  test('warms up again after a reset', () => {
    const budget: FrameBudget = createFrameBudget(options);
    feed(budget, [16, 16, 60, 60]);
    budget.reset();
    expect(feed(budget, [60, 60, 60])).toEqual([false, false, false]);
  });
});
