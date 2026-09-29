import { gsap } from 'gsap';

// ── Embers: sparks that rise from the name, sway and burn out ──

/** Ember colours as "r, g, b": gold, pink, lavender. */
const COLORS: readonly string[] = ['255, 210, 122', '255, 122, 198', '199, 125, 255'];
/** New embers per second at full strength. */
const RATE: number = 30;
/** Hard cap on live embers. */
const MAX_EMBERS: number = 90;
/** Seconds for the spawn rate to ramp up after start, so sparks follow the letters in. */
const RAMP: number = 1.4;

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
  phase: number;
}

export interface Embers {
  start: () => void;
  stop: () => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

function spawn(area: Area): Ember {
  const random: (min: number, max: number) => number = gsap.utils.random;
  return {
    x: area.x + random(0.05, 0.95) * area.width,
    y: area.y + random(0.15, 0.6) * area.height,
    vx: random(-12, 12),
    vy: random(-80, -35),
    age: 0,
    life: random(1.3, 2.6),
    size: random(0.8, 2.4),
    color: COLORS[Math.floor(random(0, COLORS.length))] ?? '255, 210, 122',
    phase: random(0, Math.PI * 2),
  };
}

function draw(context: CanvasRenderingContext2D, ember: Ember): void {
  // Fade in quickly, burn out slowly.
  const alpha: number = Math.min(1, ember.age * 5) * (1 - ember.age / ember.life);
  context.fillStyle = `rgba(${ember.color}, ${(alpha * 0.22).toFixed(3)})`;
  context.beginPath();
  context.arc(ember.x, ember.y, ember.size * 3.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = `rgba(${ember.color}, ${alpha.toFixed(3)})`;
  context.beginPath();
  context.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
  context.fill();
}

/**
 * Sparks drawn on a canvas that sits over `source`. Only runs between start() and stop().
 */
export function createEmbers(
  canvas: HTMLCanvasElement,
  source: HTMLElement,
  reducedMotion: boolean,
): Embers | null {
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!context || reducedMotion) {
    return null;
  }

  let embers: Ember[] = [];
  let area: Area = { x: 0, y: 0, width: 0, height: 0 };
  // `spawning` stops at stop(); `running` lasts until the last ember has burned out.
  let running: boolean = false;
  let spawning: boolean = false;
  let elapsed: number = 0;
  let debt: number = 0;

  const measure = (): void => {
    const dpr: number = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const box: DOMRect = canvas.getBoundingClientRect();
    const text: DOMRect = source.getBoundingClientRect();
    area = {
      x: text.left - box.left,
      y: text.top - box.top,
      width: text.width,
      height: text.height,
    };
  };

  const tick = (_time: number, deltaMs: number): void => {
    const dt: number = Math.min(deltaMs / 1000, 0.05);
    elapsed += dt;
    debt += spawning ? dt * RATE * Math.min(1, elapsed / RAMP) : 0;
    while (debt >= 1 && embers.length < MAX_EMBERS) {
      embers.push(spawn(area));
      debt -= 1;
    }
    debt = Math.min(debt, 1);

    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    context.globalCompositeOperation = 'lighter';
    embers = embers.filter((ember: Ember): boolean => {
      ember.age += dt;
      ember.x += (ember.vx + Math.sin(ember.age * 3 + ember.phase) * 14) * dt;
      ember.y += ember.vy * dt;
      if (ember.age >= ember.life) {
        return false;
      }
      draw(context, ember);
      return true;
    });

    if (!spawning && embers.length === 0) {
      running = false;
      gsap.ticker.remove(tick);
    }
  };

  new ResizeObserver(measure).observe(canvas);

  return {
    start: (): void => {
      if (spawning) {
        return;
      }
      spawning = true;
      elapsed = 0;
      if (!running) {
        running = true;
        measure();
        gsap.ticker.add(tick);
      }
    },
    stop: (): void => {
      // No new sparks; the ones in flight rise and burn out on their own.
      spawning = false;
      debt = 0;
    },
  };
}
