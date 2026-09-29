import { gsap } from 'gsap';
import type { ShatterInstance } from '../../vendor/canvas-ui/Shatter/ShatterVanilla';
import type { Mounted } from '../effects/mount';
import type { Transition, TransitionRun, TransitionScenes } from './controller';
import { finished } from './timelines';
import { revealScene } from '../motion/reveal';

// ── Shatter transition: the live page breaks into glass shards and reassembles ──

function loadShatter(stage: HTMLElement): Promise<Mounted<ShatterInstance> | null> {
  return import('../effects/shatter').then(
    ({ mountShatter }): Mounted<ShatterInstance> | null => mountShatter(stage),
    (): null => null,
  );
}

/**
 * Wrap a fallback transition with Canvas UI Shatter. Shatter only runs for a clean change
 * from one scene to another; hand-offs after an interruption, or a failed effect, use the
 * fallback. A cancelled shatter settles its shards quickly instead of snapping away.
 */
export function withShatter(stage: HTMLElement, fallback: Transition): Transition {
  return (scenes: TransitionScenes): TransitionRun => {
    if (scenes.resuming || scenes.leaving.length !== 1) {
      return fallback(scenes);
    }
    const { leaving, to }: TransitionScenes = scenes;
    const done: PromiseWithResolvers<boolean> = Promise.withResolvers<boolean>();
    let cancelled: boolean = false;
    let inner: TransitionRun | null = null;
    let settle: (() => void) | null = null;

    const play = async (): Promise<void> => {
      const mounted: Mounted<ShatterInstance> | null = await loadShatter(stage);
      if (cancelled) {
        mounted?.unmount();
        return;
      }
      if (!mounted) {
        inner = fallback(scenes);
        done.resolve(await inner.finished);
        return;
      }

      const state: { strength: number } = { strength: 0 };
      const apply = (): void => {
        mounted.instance.setOptions({ baseStrength: state.strength });
      };
      gsap.set(to, { autoAlpha: 0 });
      const timeline: gsap.core.Timeline = gsap
        .timeline()
        .to(state, { strength: 1, duration: 0.55, ease: 'power3.in', onUpdate: apply })
        .add((): void => {
          gsap.set(leaving, { autoAlpha: 0 });
          gsap.set(to, { autoAlpha: 1, zIndex: 3 });
          revealScene(to);
        })
        .to(state, { strength: 0, duration: 0.8, ease: 'expo.out', onUpdate: apply });
      settle = (): void => {
        timeline.kill();
        gsap.to(state, {
          strength: 0,
          duration: 0.25,
          onUpdate: apply,
          onComplete: mounted.unmount,
        });
      };

      await finished(timeline);
      mounted.unmount();
      gsap.set([...leaving, to], { clearProps: 'all' });
      done.resolve(true);
    };
    void play();

    return {
      finished: done.promise,
      cancel: (): void => {
        cancelled = true;
        inner?.cancel();
        settle?.();
        done.resolve(false);
      },
    };
  };
}
