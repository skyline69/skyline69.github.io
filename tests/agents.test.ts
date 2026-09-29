import { describe, expect, test } from 'bun:test';
import {
  AI_CRAWLERS,
  buildLlmsTxt,
  buildMarkdown,
  buildRobotsTxt,
  formatContentSignal,
  type AgentSite,
} from '../src/lib/agents';

const site: AgentSite = {
  url: 'https://dasguney.com/',
  title: 'Efe (skyline69)',
  description: 'Efe builds fast software: mostly Rust.',
  name: 'Efe',
  headline: 'I build big, fast software, mostly in Rust.',
  intro: 'Maker of Tron Terminal.',
  summary: ['I am 21.'],
  origin: 'Turkey',
  languages: ['German', 'English'],
  next: 'A startup',
  githubUrl: 'https://github.com/skyline69',
  projects: [
    {
      title: 'Tron Terminal',
      description: 'Terminal emulator.',
      tags: ['Rust'],
      repoUrl: 'https://github.com/skyline69/tron-terminal',
      archived: false,
    },
    {
      title: 'Balatro Mod Manager',
      description: 'Mod manager.',
      tags: ['Rust', 'Svelte'],
      repoUrl: 'https://github.com/skyline69/balatro-mod-manager',
      archived: true,
      note: 'Discontinued.',
    },
  ],
  stack: [
    { name: 'Rust', url: 'https://www.rust-lang.org/', usedIn: ['Tron Terminal'] },
    { name: 'Go', url: 'https://go.dev/', usedIn: [] },
  ],
  cards: [{ title: 'On repeat', body: 'R&B and', accent: 'rap.' }],
};

describe('formatContentSignal', () => {
  test('lists every signal', () => {
    expect(formatContentSignal({ search: true, aiInput: true, aiTrain: false })).toBe(
      'search=yes, ai-input=yes, ai-train=no',
    );
  });
});

describe('buildRobotsTxt', () => {
  const robots: string = buildRobotsTxt(site.url, { search: true, aiInput: true, aiTrain: true });

  test('gives every group the content signals', () => {
    expect(
      robots.match(/^Content-Signal: search=yes, ai-input=yes, ai-train=yes$/gmu)?.length,
    ).toBe(2);
  });

  test('names each AI crawler once', () => {
    for (const agent of AI_CRAWLERS) {
      expect(
        robots.split('\n').filter((line: string) => line === `User-agent: ${agent}`),
      ).toHaveLength(1);
    }
  });

  test('points to the sitemap', () => {
    expect(robots).toContain('Sitemap: https://dasguney.com/sitemap.xml');
  });
});

describe('buildMarkdown', () => {
  const markdown: string = buildMarkdown(site, 'https://dasguney.com/og.png');

  test('starts with quoted front matter', () => {
    expect(markdown.startsWith('---\ntitle: "Efe (skyline69)"\n')).toBe(true);
    expect(markdown).toContain('description: "Efe builds fast software: mostly Rust."');
  });

  test('marks archived projects with their note', () => {
    expect(markdown).toContain('- Status: Discontinued.');
    expect(markdown.match(/- Status:/gu)?.length).toBe(1);
  });

  test('says where each tool is used', () => {
    expect(markdown).toContain('- [Rust](https://www.rust-lang.org/): Used in Tron Terminal.');
    expect(markdown).toContain('- [Go](https://go.dev/): In the toolbox');
  });

  test('uses no em dashes', () => {
    expect(markdown).not.toContain('—');
  });
});

describe('buildLlmsTxt', () => {
  const llms: string = buildLlmsTxt(site);

  test('follows the llms.txt layout', () => {
    expect(llms.startsWith('# Efe (skyline69)\n\n> ')).toBe(true);
    expect(llms).toContain('(https://dasguney.com/index.md)');
  });

  test('flags archived projects', () => {
    expect(llms).toContain('Mod manager. (archived)');
  });
});
