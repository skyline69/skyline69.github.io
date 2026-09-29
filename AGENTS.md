# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Single-page developer portfolio built with Astro 7 (static output) and vanilla TypeScript. The page is a **stage**: four full-screen scenes (Intro, Work, Stack, Me) shown one at a time. Wheel, swipe, arrow keys and the nav change scenes; the page itself never scrolls. Without JavaScript the scenes stack as a normal scrolling page. Content comes from Astro Content Collections.

Runtime dependencies: `gsap` (core, Observer, SplitText), `ogl` (the intro fire shader, lazy-loaded) and vendored Canvas UI effects. No UI framework, no Tailwind, no CSS preprocessor.

## Commands

```bash
# Package manager: bun (Node 22.12+ is also required by Astro 7)
bun install
bun run dev              # Dev server
bun run build            # Production build
bun run preview          # Preview the build

bun run check            # astro check (TypeScript, strictest)
bun run lint             # oxlint, type-aware, warnings fail
bun run format           # oxfmt (write)
bun run format:check     # oxfmt (check only)
bun test                 # Unit tests in tests/
bun run verify           # All of the above plus build. Must pass before work counts as done.
bun astro sync           # Regenerate .astro/ types after changing content.config.ts
```

CI (`.github/workflows/deploy.yml`) runs `bun run verify` on every push and pull request; deploys only happen when it passes.

## Project Structure

```
src/
├── pages/index.astro               # Assembles the stage, meta, JSON-LD
├── pages/sitemap.xml.ts            # One-page sitemap
├── pages/robots.txt.ts             # robots.txt: Content Signals + AI crawler rules
├── pages/index.md.ts               # The page as Markdown (for agents)
├── pages/llms.txt.ts, llms-full.txt.ts
├── layouts/Layout.astro            # <head>, font preload, OG tags, origin trial meta
├── components/
│   ├── SiteHeader.astro, SceneFooter.astro, Stage.astro, Icon.astro
│   └── scenes/{Intro,Work,Stack,Me}Scene.astro
├── content.config.ts               # Zod schemas
├── content/                        # profile, projects, tech, highlights (frontmatter only)
├── lib/
│   ├── content.ts                  # Collection queries (astro:content)
│   ├── stack.ts, seo.ts, date.ts   # Pure logic, unit tested
│   ├── agents.ts                   # Pure builders for robots.txt, Markdown, llms.txt (tested)
│   ├── site.ts                     # Title/description + page data shared by page and agent files
│   ├── stage.ts                    # Client orchestrator: controller + motion + effects
│   ├── scenes/                     # state.ts (pure), controller.ts, timelines.ts, shatter-transition.ts
│   ├── motion/                     # intro, reveal, mist, nav, work, stack (GSAP); fire (OGL shader), embers, name-fx
│   └── effects/                    # detect, mount, scene-effects, liquid, shatter (Canvas UI adapters)
├── vendor/canvas-ui/               # Canvas UI source, copied unmodified (see below)
├── scripts/main.ts                 # Client entry
└── styles/global.css               # @font-face, tokens, reset, shared pieces
public/fonts/instrument-serif/      # Self-hosted Instrument Serif (regular + italic)
tests/                              # bun:test suites for the pure lib modules
```

Keep logic in `src/lib/*.ts` and keep `.astro` files thin. Oxlint only partly understands `.astro` files, so strict linting only fully covers `.ts`.

## Design Rules

- **One font**: Instrument Serif, self-hosted. No monospace, no second family, no Google Fonts.
- **No emojis** anywhere. Arrows and icons are inline SVG (`Icon.astro`).
- **No em dashes** and no "·" separators in visible copy.
- **Palette** (tokens in `global.css`): `--void #000`, `--plum #3E065F`, `--violet #700B97`, `--orchid #8E05C2` for surfaces, borders and glows. Text uses `--ink`, `--haze`, `--glow`, `--dim`, which were chosen for contrast on black. `--orchid` is not a text colour on black.
- Rounded shapes, glows and GSAP motion are allowed. Every animation needs a reduced-motion path (usually a crossfade or no motion).
- Astro 7 strips whitespace between elements with JSX rules. When text and an element sit on separate lines and need a space, write `{' '}`.

## TypeScript and Lint

- `tsconfig` extends `astro/tsconfigs/strictest` (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, ...).
- `oxlint.config.ts`: correctness, suspicious, perf and pedantic categories as errors, type-aware via `oxlint-tsgolint`. Notable rules: explicit return types, `import type`, no `any`, no non-null assertions, strict boolean expressions, no floating promises, functions up to 80 lines.
- Annotate variables and parameters explicitly, following the existing code.
- **No `try/catch`**: use guard clauses. Handle promise failure with `.then(ok, fail)`.
- Style (enforced by oxfmt): single quotes, semicolons, trailing commas, width 100.
- Comments: `// ── Section Name ──` separators; JSDoc on exported functions and at the top of component frontmatter.

## Client Script Pattern

- One entry (`scripts/main.ts`) calls `initStage()`, which guards against double init with `data-stage-init`.
- Scene elements carry `data-scene="<id>"`; hidden scenes get `inert`. Each scene has one `[data-scene-focus]` heading that receives focus on change.
- Entrance hooks: `[data-reveal]` (rise), `[data-reveal-words]` (word stagger), `[data-reveal-pop]` (pop from centre).
- Capabilities come from `lib/effects/detect.ts`. Check `reducedMotion` and `finePointer` before adding motion or cursor effects.

## Agent Access

The site is built for crawlers and AI agents as well as people. All agent files are generated at build time from the content collections, so they never drift from the page.

- `robots.txt` (`lib/agents.ts` `buildRobotsTxt`): Cloudflare's Content Signals Policy text, `Content-Signal: search=yes, ai-input=yes, ai-train=yes` in every group, all AI crawlers in `AI_CRAWLERS` explicitly allowed, sitemap link. Change the signals in `pages/robots.txt.ts`.
- `/index.md`: the whole page as Markdown with YAML front matter. `/llms.txt` is the llmstxt.org summary, `/llms-full.txt` the Markdown body.
- `<head>` links the Markdown and llms.txt as `rel="alternate"`. JSON-LD is a WebSite + ProfilePage + Person + projects graph (`lib/seo.ts`).
- GitHub Pages cannot set headers. Markdown negotiation (`Accept: text/markdown` on `/` served from `/index.md`), the `Link` response header and `Vary: Accept` come from Cloudflare Transform Rules on the `dasguney.com` zone, not from this repo. Cloudflare's managed robots.txt must stay off, or it prepends its own signals.
- Visible-copy rules (no em dashes, first name only) apply to these files too.

## Canvas UI

- Vendored under `src/vendor/canvas-ui/` (MIT + Commons Clause, see `LICENSE.md`). Files are unmodified apart from a `// @ts-nocheck` first line; oxlint and oxfmt ignore the folder.
- Only `lib/effects/*` may import vendor code, and only through dynamic `import()` so browsers without HTML-in-Canvas never download it.
- In use: Shatter (scene transitions) and Liquid (Work image frame). Every effect has a GSAP or CSS fallback that must look finished on its own.
- Effects need the Chrome HTML-in-Canvas origin trial. The token comes from the `ORIGIN_TRIAL_TOKEN` env var (a GitHub repository variable in CI); when unset, no meta tag is emitted.

## Content Collections

All collections use the `glob` loader and frontmatter only. Filterable collections have `active` and `order`; queries in `lib/content.ts` filter by `active` and sort by `order`.

- **projects**: `visual: screenshot | icon`, `status: active | archived`, optional `note` and `siteUrl`. `tags` must match tech names exactly: the Stack scene links tools to projects through them.
- **tech**: `name`, `icon` (SVG next to the file), `url`.
- **highlights**: cards in the Me scene, optional italic `accent`.
- **profile**: singleton; `summary` supports `{age}`.

## File Naming

| Location          | Convention           | Example                  |
| ----------------- | -------------------- | ------------------------ |
| `src/components/` | PascalCase `.astro`  | `SceneFooter.astro`      |
| `src/pages/`      | kebab-case           | `index.astro`            |
| `src/lib/`        | kebab or camel `.ts` | `scene-effects.ts`       |
| `src/content/`    | kebab-case `.md`     | `balatro-mod-manager.md` |
