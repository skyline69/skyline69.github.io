import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { SplitText } from 'gsap/SplitText';
import { detectCapabilities, type Capabilities } from './effects/detect';
import { createSceneEffects, type SceneEffects } from './effects/scene-effects';
import { playIntro } from './motion/intro';
import { createMist, type Mist } from './motion/mist';
import { createNameFx, type NameFx } from './motion/name-fx';
import { createHeaderChrome, type HeaderChrome } from './motion/header';
import { revealScene } from './motion/reveal';
import { initStack, type Stack } from './motion/stack';
import { initWork, type Work } from './motion/work';
import { SceneController, type Transition } from './scenes/controller';
import { withShatter } from './scenes/shatter-transition';
import { SCENE_IDS, type SceneId } from './scenes/state';
import { crossfade, wipe } from './scenes/timelines';

// ── Stage: wires scenes, motion and effects together ──

function sceneElement(stage: HTMLElement, id: SceneId): HTMLElement | null {
  return stage.querySelector<HTMLElement>(`[data-scene="${id}"]`);
}

function pickTransition(stage: HTMLElement, capabilities: Capabilities): Transition {
  if (capabilities.reducedMotion) {
    return crossfade;
  }
  return capabilities.htmlInCanvas ? withShatter(stage, wipe) : wipe;
}

/**
 * Start the stage. Safe to call twice; the second call does nothing.
 */
export function initStage(): void {
  const stage: HTMLElement | null = document.querySelector<HTMLElement>('[data-stage]');
  if (!stage || stage.dataset['stageInit'] === 'true') {
    return;
  }
  stage.dataset['stageInit'] = 'true';

  gsap.registerPlugin(Observer, SplitText);
  const capabilities: Capabilities = detectCapabilities();
  document.documentElement.classList.toggle('reduced-motion', capabilities.reducedMotion);

  const scenes: HTMLElement[] = SCENE_IDS.map((id: SceneId): HTMLElement | null =>
    sceneElement(stage, id),
  ).filter((el: HTMLElement | null): el is HTMLElement => el !== null);
  if (scenes.length !== SCENE_IDS.length) {
    return;
  }

  const intro: HTMLElement | null = sceneElement(stage, 'intro');
  const nameFx: NameFx | null = intro ? createNameFx(intro, capabilities) : null;
  // The first burn waits for the letters to land; later visits catch fire quickly.
  let fireDelay: number = 0.7;
  const workScene: HTMLElement | null = sceneElement(stage, 'work');
  const work: Work | null = workScene ? initWork(workScene, capabilities) : null;
  const stackScene: HTMLElement | null = sceneElement(stage, 'stack');
  const stack: Stack | null = stackScene ? initStack(stackScene, capabilities) : null;

  const effects: SceneEffects = createSceneEffects(stage, capabilities.htmlInCanvas, {
    onLiquid: (liquid): void => {
      work?.setLiquid(liquid);
    },
  });

  let mist: Mist | null = null;
  let header: HeaderChrome | null = null;
  const onScene = (id: SceneId): void => {
    header?.moveTo(id);
    mist?.moveTo(id);
    stack?.setVisible(id === 'stack');
    if (id === 'intro') {
      nameFx?.start(fireDelay);
      fireDelay = 0.1;
    } else {
      nameFx?.stop();
    }
    effects.activate(id);
  };

  const controller: SceneController = new SceneController({
    scenes,
    transition: pickTransition(stage, capabilities),
    beforeChange: (_from: SceneId, to: SceneId): void => {
      effects.deactivate();
      work?.reset();
      nameFx?.stop();
      // Tabs react as the change starts, not when the transition ends.
      header?.moveTo(to);
    },
    afterChange: onScene,
  });

  mist = createMist(stage, controller.current, capabilities.reducedMotion);
  header = createHeaderChrome(controller.current, capabilities.reducedMotion);
  document.documentElement.classList.add('stage-ready');

  const startsOnIntro: boolean = controller.current === 'intro';
  if (intro) {
    void playIntro(intro, capabilities, startsOnIntro);
  }
  const first: HTMLElement | undefined = scenes[controller.index];
  if (!startsOnIntro && first && !capabilities.reducedMotion) {
    revealScene(first);
  }
}
