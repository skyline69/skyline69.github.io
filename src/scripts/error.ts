import { detectCapabilities } from '../lib/effects/detect';
import { createNameFx, type NameFx } from '../lib/motion/name-fx';

// ── Client entry for the 404: the status code burns like the intro name ──
const box: HTMLElement | null = document.querySelector<HTMLElement>('[data-burn]');
const fx: NameFx | null = box ? createNameFx(box, detectCapabilities()) : null;
// The fire mask is drawn from the letters, so wait for the web font.
await document.fonts.ready;
fx?.start(0.35);
