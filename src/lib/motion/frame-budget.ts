// ── Frame budget: notice when a device cannot keep an effect smooth ──

export interface FrameBudgetOptions {
  /** Frames ignored after a reset (shader compile, first uploads). */
  warmup: number;
  /** Frames averaged per verdict. */
  window: number;
  /** Average frame time above which the effect should stop. */
  limitMs: number;
}

export interface FrameBudget {
  /** Record one frame; true once the average of a full window is over the limit. */
  sample: (deltaMs: number) => boolean;
  /** Start over, with a fresh warm-up. */
  reset: () => void;
}

const DEFAULTS: FrameBudgetOptions = { warmup: 20, window: 60, limitMs: 40 };

/**
 * Average frame times in fixed windows. Slow devices (and software WebGL) run an effect
 * far below the limit, so one full window is enough to decide.
 */
export function createFrameBudget(options: FrameBudgetOptions = DEFAULTS): FrameBudget {
  let seen: number = 0;
  let total: number = 0;
  let counted: number = 0;

  const reset = (): void => {
    seen = 0;
    total = 0;
    counted = 0;
  };

  return {
    sample: (deltaMs: number): boolean => {
      seen += 1;
      if (seen <= options.warmup) {
        return false;
      }
      total += deltaMs;
      counted += 1;
      if (counted < options.window) {
        return false;
      }
      const over: boolean = total / counted > options.limitMs;
      total = 0;
      counted = 0;
      return over;
    },
    reset,
  };
}
