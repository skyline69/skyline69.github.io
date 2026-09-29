// @ts-check
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://dasguney.com',
  env: {
    schema: {
      // Chrome origin trial token for the HTML-in-Canvas API (Canvas UI effects).
      // Leave unset to ship without it; every effect then uses its fallback.
      ORIGIN_TRIAL_TOKEN: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },
  server: {
    allowedHosts: true,
  },
  vite: {
    preview: {
      allowedHosts: true,
    },
  },
});
