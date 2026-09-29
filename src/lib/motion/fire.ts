import { gsap } from 'gsap';
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

// ── Fire: a WebGL shader (via OGL) that burns above the name ──
// The name is drawn once into a soft mask texture. Every pixel gathers "heat" from the
// letters below it, and layered noise that scrolls upward forever tears the heat into
// flame tongues, so the fire never loops.

// GLSL ES 1.0, so it runs on WebGL1 as well.
const VERTEX: string = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT: string = `
precision highp float;
uniform sampler2D uMask;
uniform float uTime;
uniform float uAspect;
uniform float uIntensity;
varying vec2 vUv;

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate * p;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  // Stretched vertically so the noise forms tall tongues instead of round blobs.
  vec2 p = vec2(vUv.x * uAspect * 1.8, vUv.y * 0.9);
  float t = uTime;

  // Domain-warped turbulence that rises continuously and never repeats.
  vec2 warp = vec2(fbm(p * 2.2 + vec2(0.0, -t * 0.7)), fbm(p * 2.2 + vec2(5.2, -t * 0.9)));
  float n = fbm(p * 3.6 + warp * 2.2 + vec2(0.0, -t * 1.9));

  // Heat collected from the letters below this pixel, bent sideways by the turbulence.
  float heat = 0.0;
  for (int i = 0; i < 10; i++) {
    float k = float(i) / 10.0;
    vec2 offset = vec2(n * 0.09 * k, -k * 0.5);
    heat += texture2D(uMask, vUv + offset).a * (1.0 - k) * (1.0 - k);
  }
  heat /= 2.6;

  // Turbulence tears the heat into tongues; gaps widen with distance from the letters.
  float flame = heat * (0.55 + n * 2.8) + heat * heat * 0.35;
  // Low intensity also raises the threshold, so the fire grows out of the letters when it
  // lights and shrinks back into them when it dies, instead of just fading.
  flame = clamp(flame * 1.8 - 0.08 - (1.0 - uIntensity) * 0.55, 0.0, 1.0);
  flame = pow(flame, 1.25) * uIntensity;

  vec3 violet = vec3(0.44, 0.04, 0.59);
  vec3 orchid = vec3(0.56, 0.02, 0.76);
  vec3 pink = vec3(1.0, 0.45, 0.78);
  vec3 gold = vec3(1.0, 0.8, 0.46);
  vec3 white = vec3(1.0, 0.96, 0.88);
  vec3 color = mix(violet, orchid, smoothstep(0.0, 0.25, flame));
  color = mix(color, pink, smoothstep(0.25, 0.55, flame));
  color = mix(color, gold, smoothstep(0.55, 0.82, flame));
  color = mix(color, white, smoothstep(0.86, 1.0, flame));

  float alpha = smoothstep(0.04, 0.4, flame);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

/** Parse a computed CSS pixel value like "420px". */
function px(value: string): number {
  return Number(value.replace(/px$/u, '')) || 0;
}

/** Mask resolution relative to the canvas. The mask is blurred anyway. */
const MASK_SCALE: number = 0.5;

export interface Fire {
  /** Start burning; the flames grow in after `delay` seconds. */
  start: (delay: number) => void;
  /** Let the fire die down, then stop rendering. */
  stop: () => void;
}

/** Letters are drawn this far off-canvas; only their blurred shadow lands in the mask. */
const SHADOW_SHIFT: number = 10_000;

/**
 * Draw the name's letters, softly blurred, where `source` sits inside `host`.
 * Works without canvas `filter` and `letterSpacing` (Safari has neither): the blur comes
 * from a shadow, and letters are placed one by one with the CSS letter spacing applied.
 */
function drawMask(mask: HTMLCanvasElement, host: HTMLElement, source: HTMLElement): void {
  const context: CanvasRenderingContext2D | null = mask.getContext('2d');
  if (!context) {
    return;
  }
  mask.width = Math.max(1, Math.round(host.clientWidth * MASK_SCALE));
  mask.height = Math.max(1, Math.round(host.clientHeight * MASK_SCALE));

  const style: CSSStyleDeclaration = getComputedStyle(source);
  const fontSize: number = px(style.fontSize);
  const lineHeight: number = px(style.lineHeight);
  const spacing: number = px(style.letterSpacing);
  const box: DOMRect = host.getBoundingClientRect();
  const text: DOMRect = source.getBoundingClientRect();
  const word: string = source.textContent.trim();

  context.setTransform(MASK_SCALE, 0, 0, MASK_SCALE, 0, 0);
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.textBaseline = 'alphabetic';
  const metrics: TextMetrics = context.measureText(word);
  const halfLeading: number =
    (lineHeight - (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)) / 2;
  const left: number = text.left - box.left + px(style.paddingLeft);
  const baseline: number = text.top - box.top + halfLeading + metrics.fontBoundingBoxAscent;

  // Shadow blur and offset ignore the transform, so they are given in mask pixels.
  context.fillStyle = '#ffffff';
  context.shadowColor = '#ffffff';
  context.shadowBlur = fontSize * 0.02 * MASK_SCALE * 2;
  context.shadowOffsetX = SHADOW_SHIFT * MASK_SCALE;
  const letters: Intl.SegmentData[] = [
    ...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word),
  ];
  letters.forEach((letter: Intl.SegmentData, i: number): void => {
    const x: number = left + context.measureText(word.slice(0, letter.index)).width + spacing * i;
    context.fillText(letter.segment, x - SHADOW_SHIFT, baseline);
  });
}

/**
 * OGL leaves `gl` undefined when the browser refuses a context, so probe first.
 */
function supportsWebGl(): boolean {
  const probe: HTMLCanvasElement = document.createElement('canvas');
  return probe.getContext('webgl2') !== null || probe.getContext('webgl') !== null;
}

interface FireScene {
  renderer: Renderer;
  mesh: Mesh;
  texture: Texture;
  mask: HTMLCanvasElement;
  time: { value: number };
  aspect: { value: number };
  intensity: { value: number };
}

/**
 * Renderer, full-screen triangle and fire program, plus the uniforms the loop drives.
 */
function buildScene(): FireScene {
  const renderer: Renderer = new Renderer({
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    dpr: 1,
  });
  const gl: Renderer['gl'] = renderer.gl;
  gl.canvas.setAttribute('aria-hidden', 'true');

  const mask: HTMLCanvasElement = document.createElement('canvas');
  const texture: Texture = new Texture(gl, {
    image: mask,
    generateMipmaps: false,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
  });
  const time: { value: number } = { value: 0 };
  const aspect: { value: number } = { value: 1 };
  const intensity: { value: number } = { value: 0 };
  const program: Program = new Program(gl, {
    vertex: VERTEX,
    fragment: FRAGMENT,
    uniforms: { uMask: { value: texture }, uTime: time, uAspect: aspect, uIntensity: intensity },
    transparent: true,
  });
  const mesh: Mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  return { renderer, mesh, texture, mask, time, aspect, intensity };
}

/**
 * Fire shader in a canvas inside `host`, fed by the letters of `source`.
 * Returns null for reduced motion or when WebGL is unavailable.
 */
export function createFire(
  host: HTMLElement,
  source: HTMLElement,
  reducedMotion: boolean,
): Fire | null {
  if (reducedMotion || !supportsWebGl()) {
    return null;
  }
  const { renderer, mesh, texture, mask, time, aspect, intensity }: FireScene = buildScene();
  host.append(renderer.gl.canvas);

  const resize = (): void => {
    renderer.setSize(host.clientWidth, host.clientHeight);
    aspect.value = host.clientWidth / Math.max(1, host.clientHeight);
    drawMask(mask, host, source);
    texture.image = mask;
    texture.needsUpdate = true;
  };

  const tick = (_time: number, deltaMs: number): void => {
    time.value += Math.min(deltaMs / 1000, 0.05);
    renderer.render({ scene: mesh });
  };

  new ResizeObserver(resize).observe(host);
  // `burning` is what was asked for; `ticking` is whether frames are still drawn,
  // which outlasts `burning` while the fire dies down.
  let burning: boolean = false;
  let ticking: boolean = false;

  const halt = (): void => {
    if (ticking) {
      ticking = false;
      gsap.ticker.remove(tick);
      renderer.render({ scene: mesh });
    }
  };

  return {
    start: (delay: number): void => {
      if (burning) {
        return;
      }
      burning = true;
      void document.fonts.ready.then(resize);
      if (!ticking) {
        ticking = true;
        gsap.ticker.add(tick);
      }
      // Relighting mid-fade continues from the current strength.
      gsap.to(intensity, { value: 1, duration: 1.4, delay, ease: 'power2.out', overwrite: true });
    },
    stop: (): void => {
      if (!burning) {
        return;
      }
      burning = false;
      gsap.to(intensity, {
        value: 0,
        duration: 0.7,
        ease: 'power2.in',
        overwrite: true,
        onComplete: (): void => {
          if (!burning) {
            halt();
          }
        },
      });
    },
  };
}
