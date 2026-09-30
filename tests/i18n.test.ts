import { describe, expect, test } from 'bun:test';
import {
  ERROR_CODES,
  LOCALES,
  MESSAGES,
  isLocale,
  localePath,
  preferredLocale,
  textIn,
  type ErrorCode,
  type Locale,
  type Messages,
} from '../src/lib/i18n';
import { SCENE_IDS } from '../src/lib/scenes/state';
import { formatList, formatUsedIn } from '../src/lib/stack';

describe('localePath', () => {
  test('puts English at the root and prefixes the rest', () => {
    expect(localePath('en')).toBe('/');
    expect(localePath('de')).toBe('/de/');
    expect(localePath('tr')).toBe('/tr/');
  });
});

describe('isLocale', () => {
  test('accepts published locales only', () => {
    expect(isLocale('de')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
  });
});

describe('preferredLocale', () => {
  test('takes the first published language, ignoring region', () => {
    expect(preferredLocale(['de-AT', 'en-US'])).toBe('de');
    expect(preferredLocale(['fr-FR', 'TR', 'de'])).toBe('tr');
    expect(preferredLocale(['en-GB'])).toBe('en');
  });

  test('is null when no published language is preferred', () => {
    expect(preferredLocale(['fr', 'nl-BE'])).toBeNull();
    expect(preferredLocale([])).toBeNull();
  });
});

describe('textIn', () => {
  const base = { body: 'Hello', accent: 'there.' };
  const translations = { de: { body: 'Hallo' }, tr: { body: 'Merhaba', accent: 'orada.' } };

  test('uses the entry itself for English', () => {
    expect(textIn(base, translations, 'en')).toBe(base);
  });

  test('never falls back to English for a missing optional field', () => {
    expect(textIn<{ body: string; accent?: string }>(base, translations, 'de')).toEqual({
      body: 'Hallo',
    });
    expect(textIn<{ body: string; accent?: string }>(base, translations, 'tr').accent).toBe(
      'orada.',
    );
  });
});

describe('formatList and formatUsedIn per locale', () => {
  test('joins with the locale word for "and"', () => {
    expect(formatList(['A', 'B', 'C'], 'de')).toBe('A, B und C');
    expect(formatList(['A', 'B'], 'tr')).toBe('A ve B');
  });

  test('builds the stack sentence', () => {
    expect(formatUsedIn(['Tron Terminal', 'neo-lolcat'], 'de')).toBe(
      'Verwendet in Tron Terminal und neo-lolcat.',
    );
    expect(formatUsedIn(['Gravitas'], 'tr')).toBe('Kullanıldığı projeler: Gravitas.');
    expect(formatUsedIn([], 'tr')).toBe(MESSAGES.tr.unused);
  });
});

/** Every string a locale can produce, with sample arguments for the functions. */
function allStrings(m: Messages): string[] {
  return [
    ...Object.values(m).filter((v: unknown): v is string => typeof v === 'string'),
    ...SCENE_IDS.map((id: (typeof SCENE_IDS)[number]): string => m.sceneLabels[id]),
    m.sceneProgress(1, 4),
    m.openProject('X'),
    m.imageAlt('X', 'icon'),
    m.imageAlt('X', 'screenshot'),
    m.usedIn('X'),
    ...ERROR_CODES.flatMap((code: ErrorCode): string[] => [
      m.errors[code].title,
      m.errors[code].body,
    ]),
  ];
}

describe('MESSAGES', () => {
  test.each([...LOCALES])('%s follows the copy rules', (locale: Locale) => {
    for (const text of allStrings(MESSAGES[locale])) {
      expect(text.trim()).not.toBe('');
      expect(text).not.toContain('—');
      expect(text).not.toContain('·');
    }
  });
});
