import { defineConfig } from 'oxlint';

// ── Oxlint: strict, type-aware ──
export default defineConfig({
  plugins: ['typescript', 'unicorn', 'import', 'oxc'],
  env: {
    browser: true,
    es2024: true,
  },
  options: {
    typeAware: true,
  },
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'error',
    pedantic: 'error',
  },
  ignorePatterns: ['dist/**', '.astro/**', 'node_modules/**', 'src/vendor/**'],
  rules: {
    // ── Types ──
    'typescript/explicit-function-return-type': 'error',
    'typescript/consistent-type-imports': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/no-non-null-assertion': 'error',
    'typescript/strict-boolean-expressions': 'error',
    'typescript/switch-exhaustiveness-check': 'error',
    'typescript/prefer-nullish-coalescing': 'error',
    'typescript/restrict-template-expressions': 'error',
    // DOM elements are mutable by nature; this rule would flag every element parameter.
    'typescript/prefer-readonly-parameter-types': 'off',

    // ── Promises ──
    'typescript/no-floating-promises': 'error',
    'typescript/no-misused-promises': 'error',
    'typescript/return-await': 'error',

    // ── Structure ──
    'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
    'import/max-dependencies': ['error', { max: 16 }],
    // CSS and the client entry are imported for their side effects on purpose.
    'import/no-unassigned-import': 'off',

    // ── Style ──
    eqeqeq: 'error',
    curly: 'error',
    'no-console': 'error',
  },
});
