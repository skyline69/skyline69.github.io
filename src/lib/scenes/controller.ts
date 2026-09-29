import { Observer } from 'gsap/Observer';
import { canScrollWithin, isTypingTarget } from './input';
import { holdPage, releasePage } from './page-hold';
import { SCENE_IDS, isSceneId, sceneFromHash, stepIndex, type SceneId } from './state';

// ── Scene controller: one scene visible at a time, driven by wheel, touch, keys and links ──

export type Direction = 1 | -1;

/** What a transition animates. */
export interface TransitionScenes {
  /** Every scene still on screen that has to go: one normally, more after an interruption. */
  leaving: readonly HTMLElement[];
  to: HTMLElement;
  direction: Direction;
  /** `to` is still (partly) on screen from an interrupted transition and glides back. */
  resuming: boolean;
}

/** A running transition. `finished` resolves true when it completes, false when cancelled. */
export interface TransitionRun {
  finished: Promise<boolean>;
  /** Freeze where it is, so the next transition can take over without a jump. */
  cancel: () => void;
}

export type Transition = (scenes: TransitionScenes) => TransitionRun;

export interface ControllerOptions {
  scenes: readonly HTMLElement[];
  transition: Transition;
  /** Runs before a transition starts, e.g. to stop effects on the outgoing scene. */
  beforeChange: (from: SceneId, to: SceneId) => void;
  /** Runs once the new scene is in place. */
  afterChange: (id: SceneId, index: number) => void;
}

interface GoOptions {
  /** Add a history entry. Off for back/forward navigation. */
  push: boolean;
  /** Move keyboard focus to the new scene heading. */
  focus: boolean;
}

const DEFAULT_GO: Readonly<GoOptions> = { push: true, focus: true };

/** Pause after a change so trackpad momentum does not skip a scene. */
const WHEEL_COOLDOWN_MS: number = 650;

const NEXT_KEYS: ReadonlySet<string> = new Set(['ArrowDown', 'ArrowRight', 'PageDown']);
const PREV_KEYS: ReadonlySet<string> = new Set(['ArrowUp', 'ArrowLeft', 'PageUp']);

export class SceneController {
  readonly #options: ControllerOptions;
  readonly #observer: Observer;
  readonly #abort: AbortController = new AbortController();
  #index: number = 0;
  #busy: boolean = false;
  #cooldownUntil: number = 0;
  /** Scene the running transition is heading to. */
  #target: number = 0;
  #run: TransitionRun | null = null;
  /** Bumped per transition; a finished run only settles if it is still the latest. */
  #token: number = 0;

  constructor(options: ControllerOptions) {
    this.#options = options;

    const initial: SceneId = sceneFromHash(window.location.hash) ?? 'intro';
    this.#index = SCENE_IDS.indexOf(initial);
    this.#show(this.#index);
    if (window.location.hash !== '' && initial === 'intro') {
      history.replaceState(null, '', window.location.pathname);
    }

    this.#observer = Observer.create({
      // Wheel only: on touch screens swipes scroll the scene, and scenes change by button.
      type: 'wheel',
      wheelSpeed: -1,
      tolerance: 12,
      preventDefault: false,
      onUp: (self: Observer): void => {
        this.#fromGesture(self.event, 1);
      },
      onDown: (self: Observer): void => {
        this.#fromGesture(self.event, -1);
      },
    });

    const signal: AbortSignal = this.#abort.signal;
    document.addEventListener(
      'keydown',
      (event: KeyboardEvent): void => {
        this.#onKey(event);
      },
      { signal },
    );
    document.addEventListener(
      'click',
      (event: MouseEvent): void => {
        this.#onClick(event);
      },
      { signal },
    );
    window.addEventListener(
      'popstate',
      (): void => {
        this.#onPopState();
      },
      { signal },
    );
  }

  /** Current scene position. */
  get index(): number {
    return this.#index;
  }

  /**
   * Where relative moves (arrow keys, swipes) start from: the scene being headed to while
   * a transition runs, so quick key presses step from the newest target, not a stale one.
   */
  get #heading(): number {
    return this.#busy ? this.#target : this.#index;
  }

  /** Current scene id. */
  get current(): SceneId {
    return SCENE_IDS[this.#index] ?? 'intro';
  }

  /**
   * Move to a scene by position. A request during a transition takes over from wherever
   * the running one is: nothing jumps, every scene on screen hands off to the new target.
   */
  async go(target: number, options?: GoOptions): Promise<void> {
    const { push, focus }: GoOptions = options ?? DEFAULT_GO;
    const scenes: readonly HTMLElement[] = this.#options.scenes;
    const next: number = stepIndex(target, 0, scenes.length);
    const to: HTMLElement | undefined = scenes[next];
    const toId: SceneId | undefined = SCENE_IDS[next];
    const fromId: SceneId | undefined = SCENE_IDS[this.#heading];
    if (next === this.#heading || !to || !toId || !fromId) {
      return;
    }

    const direction: Direction = next > this.#heading ? 1 : -1;
    const resuming: boolean = to.classList.contains('is-active');
    this.#run?.cancel();
    this.#token += 1;
    const token: number = this.#token;
    this.#busy = true;
    this.#target = next;
    this.#options.beforeChange(fromId, toId);

    const leaving: HTMLElement[] = scenes.filter(
      (scene: HTMLElement): boolean => scene !== to && scene.classList.contains('is-active'),
    );
    scenes.forEach((scene: HTMLElement): void => {
      scene.toggleAttribute('inert', scene !== to);
    });
    // Every scene opens at its top: its own scroller on desktop; on touch screens it is
    // placed where the page is scrolled to, and the page moves back up once it is done.
    if (!resuming) {
      to.scrollTop = 0;
    }
    holdPage(to, resuming);
    to.classList.add('is-active');

    const run: TransitionRun = this.#options.transition({ leaving, to, direction, resuming });
    this.#run = run;
    const completed: boolean = await run.finished;
    if (!completed || token !== this.#token) {
      return;
    }

    this.#run = null;
    leaving.forEach((scene: HTMLElement): void => {
      scene.classList.remove('is-active');
    });
    releasePage(to, scenes);
    this.#index = next;
    this.#busy = false;
    if (push) {
      history.pushState(null, '', toId === 'intro' ? window.location.pathname : `#${toId}`);
    }
    if (focus) {
      to.querySelector<HTMLElement>('[data-scene-focus]')?.focus({ preventScroll: true });
    }
    this.#options.afterChange(toId, next);
    this.#cooldownUntil = performance.now() + WHEEL_COOLDOWN_MS;
  }

  /** Stop listening to input. */
  destroy(): void {
    this.#observer.kill();
    this.#abort.abort();
  }

  #show(index: number): void {
    this.#options.scenes.forEach((scene: HTMLElement, i: number): void => {
      const active: boolean = i === index;
      scene.classList.toggle('is-active', active);
      scene.toggleAttribute('inert', !active);
    });
    const id: SceneId | undefined = SCENE_IDS[index];
    if (id) {
      this.#options.afterChange(id, index);
    }
  }

  #fromGesture(event: Event, direction: Direction): void {
    const scene: HTMLElement | undefined = this.#options.scenes[this.#index];
    if (!scene || this.#busy || performance.now() < this.#cooldownUntil) {
      return;
    }
    if (canScrollWithin(event.target, scene, direction)) {
      return;
    }
    void this.go(this.#heading + direction, { push: true, focus: false });
  }

  #onKey(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      isTypingTarget(event.target)
    ) {
      return;
    }
    const scene: HTMLElement | undefined = this.#options.scenes[this.#index];
    let direction: Direction | null = null;
    if (NEXT_KEYS.has(event.key)) {
      direction = 1;
    } else if (PREV_KEYS.has(event.key)) {
      direction = -1;
    } else if (event.key === 'Home') {
      event.preventDefault();
      void this.go(0);
      return;
    } else if (event.key === 'End') {
      event.preventDefault();
      void this.go(this.#options.scenes.length - 1);
      return;
    }
    if (direction === null || !scene || canScrollWithin(event.target, scene, direction)) {
      return;
    }
    event.preventDefault();
    void this.go(this.#heading + direction);
  }

  #onClick(event: MouseEvent): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }
    const link: HTMLAnchorElement | null =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
        : null;
    const id: string = link?.hash.slice(1) ?? '';
    if (!link || !isSceneId(id)) {
      return;
    }
    event.preventDefault();
    void this.go(SCENE_IDS.indexOf(id));
  }

  #onPopState(): void {
    const id: SceneId = sceneFromHash(window.location.hash) ?? 'intro';
    void this.go(SCENE_IDS.indexOf(id), { push: false, focus: true });
  }
}
