# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Single-page developer portfolio built with Astro (static output). No frameworks (React, Svelte, etc.), no CSS preprocessors, no Tailwind. Pure Astro components with vanilla TypeScript and scoped CSS. One page (`src/pages/index.astro`) with content driven by Astro Content Collections.

## Commands

```bash
# Package manager: bun
bun install              # Install dependencies
bun run dev              # Start dev server
bun run build            # Production build
bun run preview          # Preview production build

# Type checking (no separate lint/test commands exist)
bun astro check          # Run Astro's type checker — must pass with 0 errors/warnings/hints
bun astro sync           # Regenerate .astro/ types (run after changing content.config.ts)
```

There is no test runner, linter, or formatter configured. `astro check` and `astro build` are the verification gates — both must pass clean before considering work complete.

## Project Structure

```
src/
├── pages/index.astro          # Single page, assembles all sections
├── layouts/Layout.astro       # HTML shell, imports global.css
├── components/*.astro         # PascalCase Astro components
├── content.config.ts          # Zod schemas + glob loaders for collections
├── content/                   # Markdown files (frontmatter-only, no body)
│   ├── profile/               # Singleton (main.md)
│   ├── highlights/            # active + order fields
│   ├── projects/              # active + order fields, has tags
│   └── tech/                  # active + order fields
├── lib/                       # camelCase .ts utilities
│   ├── content.ts             # Per-collection query functions
│   └── date.ts                # getAge() helper
└── styles/global.css          # Design tokens, reset, layout primitives
public/
├── fonts/fira-code/           # Self-hosted Fira Code woff2 (400, 600, 700)
├── assets/icons/              # Tech stack SVGs
├── assets/projects/           # Project screenshot .webp files
└── favicon.{svg,ico}
```

## TypeScript Conventions

This project extends `astro/tsconfigs/strict`. Apply explicit types everywhere.

```ts
// Variables and DOM queries — always annotate
const el: HTMLElement | null = document.querySelector<HTMLElement>('[data-x]');
const links: NodeListOf<HTMLAnchorElement> = nav.querySelectorAll<HTMLAnchorElement>('a');
let ticking: boolean = false;

// Functions — explicit parameter and return types
function getAge(birthDate: string): number { ... }
function initNav(): void { ... }
(entries: IntersectionObserverEntry[]): void => { ... }

// Component props — use `interface Props`
interface Props { text: string; speed?: number; }
const { text, speed = 70 } = Astro.props;
```

Use `interface` for local data structures. Use type guards (`el is HTMLElement`) for filter predicates. Non-null assertions (`!`) are acceptable only after a preceding null check in the same scope.

## Code Style

- **Single quotes**, **semicolons**, **trailing commas** in multi-line structures
- **No `try/catch`** — use guard clauses with early returns (`if (!el) return;`)
- **No third-party runtime deps** — vanilla TypeScript only
- **Comments**: `// ── Section Name ──` with box-drawing characters for visual separators
- **JSDoc** on exported functions and at the top of component frontmatter

## File Naming

| Location | Convention | Example |
|---|---|---|
| `src/components/` | PascalCase `.astro` | `SectionTitle.astro` |
| `src/layouts/` | PascalCase `.astro` | `Layout.astro` |
| `src/pages/` | kebab-case `.astro` | `index.astro` |
| `src/lib/` | camelCase `.ts` | `content.ts` |
| `src/content/` | kebab-case `.md` | `balatro-mod-manager.md` |
| `public/assets/` | kebab-case | `neo-lolcat.webp` |

## Astro Component Structure

Sections always appear in this order: (1) frontmatter with imports, Props interface, data fetching; (2) HTML template; (3) scoped `<style>`; (4) client-side `<script>` (only when needed).

```astro
---
// 1. Imports (framework first, then local)
import { getCollection } from 'astro:content';
import SectionTitle from './SectionTitle.astro';

// 2. Props interface (if component accepts props)
interface Props { text: string; }
const { text } = Astro.props;

// 3. Data fetching / server-side logic
const items = await getActiveProjects();
---

<!-- 4. HTML template -->
<section class="section" id="projects">
  <div class="container">...</div>
</section>

<!-- 5. Scoped <style> -->
<style>
  .section { ... }
</style>

<!-- 6. Client-side <script> (only when needed) -->
<script>
  function initFeature(): void { ... }
  initFeature();
  document.addEventListener('astro:after-swap', initFeature);
</script>
```

## Client-Side Script Pattern

Every `<script>` block must: (1) wrap logic in a named `init*` function with `: void` return type; (2) call it immediately at module level; (3) register for view transitions: `document.addEventListener('astro:after-swap', initFn)`; (4) check `prefers-reduced-motion` and bail early if animations should be disabled; (5) guard against re-initialization using `data-*` attributes when applicable.

## Content Collections

### Schema pattern

All collections use `glob` loader. Filterable collections include `active: z.boolean().default(true)` and `order: z.number()`.

### Query pattern (src/lib/content.ts)

One exported async function per collection. Filter by `active !== false`, sort by `order` ascending. `getProfile()` is a singleton — returns `entries[0]` with no filter.

To add content, create a `.md` file in the appropriate `src/content/` subdirectory with YAML frontmatter matching the Zod schema. Set `active: true` and choose an `order` number. No markdown body is used — all data lives in frontmatter.

## CSS Guidelines

### Design tokens — always use variables, never raw colors

```
--bg: #3C3633    --bg-alt: #332F2D    --panel: #747264
--accent: #E0CCBE   --highlight: #C9A87C   --dim: #8A8477   --text: #EEEDEB
--font   --max-width   --gap   --section-gap   --radius (always 0)
```

### Patterns

- Subtle borders: `color-mix(in srgb, var(--accent) 12%, transparent)`
- No `border-radius` — sharp corners everywhere (`--radius: 0`)
- No `box-shadow`, no `transition`, no `transform` for hover states
- Hover effects: underlines and color changes only
- Responsive breakpoints: `768px` (primary), `480px` (small mobile, nav only)
- `prefers-reduced-motion: reduce` media query for every animation
- BEM-like flat naming: `.component-element`, `.component--modifier`
- `font-variant-numeric: tabular-nums` on all number displays

### Layout

Page uses a `.block-grid` (2-column CSS Grid with `align-items: start`) for content sections. Hero and footer are outside the grid. On mobile, grid collapses to single column.

## Accessibility

- `aria-hidden="true"` on decorative elements (numbers, arrows, background effects)
- `aria-label` on interactive elements without visible text (e.g., scroll-down chevron)
- `loading="lazy"` on below-fold images
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<footer>`, `<aside>`
- All animations respect `prefers-reduced-motion`
