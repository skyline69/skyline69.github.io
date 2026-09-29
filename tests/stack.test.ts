import { describe, expect, test } from 'bun:test';
import { buildStack, formatList, formatUsedIn, type StackItem } from '../src/lib/stack';

describe('formatList', () => {
  test('joins zero, one, two and many names', () => {
    expect(formatList([])).toBe('');
    expect(formatList(['Rust'])).toBe('Rust');
    expect(formatList(['Rust', 'Svelte'])).toBe('Rust and Svelte');
    expect(formatList(['A', 'B', 'C'])).toBe('A, B and C');
  });
});

describe('formatUsedIn', () => {
  test('names projects or falls back for unused tech', () => {
    expect(formatUsedIn(['Tron Terminal'])).toBe('Used in Tron Terminal.');
    expect(formatUsedIn([])).toBe('In the toolbox, not in a listed project yet.');
  });
});

describe('buildStack', () => {
  const tech = [
    { name: 'Rust', url: 'https://rust-lang.org' },
    { name: 'Svelte', url: 'https://svelte.dev' },
    { name: 'Tauri', url: 'https://tauri.app' },
    { name: 'Go', url: 'https://go.dev' },
  ];
  const projects = [
    { title: 'Tron Terminal', tags: ['Rust', 'WGSL'] },
    { title: 'Balatro Mod Manager', tags: ['Rust', 'Svelte', 'Tauri'] },
  ];
  const stack: StackItem[] = buildStack(tech, projects);

  test('keeps tech order', () => {
    expect(stack.map((item: StackItem): string => item.name)).toEqual([
      'Rust',
      'Svelte',
      'Tauri',
      'Go',
    ]);
  });

  test('resolves projects in project order', () => {
    expect(stack[0]?.usedIn).toEqual(['Tron Terminal', 'Balatro Mod Manager']);
    expect(stack[3]?.usedIn).toEqual([]);
  });

  test('relates tech that ships together, ignoring tags not on the wall', () => {
    expect(stack[0]?.related).toEqual(['Svelte', 'Tauri']);
    expect(stack[1]?.related).toEqual(['Rust', 'Tauri']);
    expect(stack[3]?.related).toEqual([]);
  });
});
