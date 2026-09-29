import { describe, expect, test } from 'bun:test';
import { buildJsonLd, serializeJsonLd, type JsonValue } from '../src/lib/seo';

const person = {
  name: 'Efe',
  handle: 'skyline69',
  siteUrl: 'https://dasguney.com/',
  githubUrl: 'https://github.com/skyline69',
  description: 'Developer',
  knowsAbout: ['Rust'],
};

describe('buildJsonLd', () => {
  const data: JsonValue = buildJsonLd(person, [
    {
      title: 'Tron Terminal',
      description: 'Terminal',
      repoUrl: 'https://github.com/skyline69/tron-terminal',
      languages: ['Rust'],
      archived: false,
    },
    {
      title: 'Balatro Mod Manager',
      description: 'Mods',
      repoUrl: 'https://github.com/skyline69/balatro-mod-manager',
      siteUrl: 'https://balatro-mod-manager.dasguney.com/',
      languages: ['Rust', 'Svelte'],
      archived: true,
    },
  ]);
  const json: string = JSON.stringify(data);

  test('describes the page as the profile of the person', () => {
    expect(json).toContain('"@type":"ProfilePage"');
    expect(json).toContain('"mainEntity":{"@id":"https://dasguney.com/#person"}');
    expect(json).toContain('"@type":"WebSite"');
  });

  test('links the person to GitHub', () => {
    expect(json).toContain('"@type":"Person"');
    expect(json).toContain('"sameAs":["https://github.com/skyline69"]');
  });

  test('uses the site url when a project has one, else the repo', () => {
    expect(json).toContain('"url":"https://github.com/skyline69/tron-terminal"');
    expect(json).toContain('"url":"https://balatro-mod-manager.dasguney.com/"');
  });

  test('marks only archived projects', () => {
    expect(json.match(/creativeWorkStatus/gu)?.length).toBe(1);
  });
});

describe('serializeJsonLd', () => {
  test('escapes angle brackets', () => {
    expect(serializeJsonLd({ a: '</script>' })).toBe('{"a":"\\u003c/script>"}');
  });
});
