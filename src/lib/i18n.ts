import type { SceneId } from './scenes/state';

// ── Locales ──

/** Languages the page is published in. English is the default and lives at the root. */
export const LOCALES = ['en', 'de', 'tr'] as const;

export type Locale = (typeof LOCALES)[number];

/** Locales with their own URL prefix and a `translations` block in the content. */
export type TranslatedLocale = Exclude<Locale, 'en'>;

export const DEFAULT_LOCALE: Locale = 'en';

/** How a locale names itself, and its Open Graph locale. */
export interface LocaleInfo {
  name: string;
  ogLocale: string;
}

export const LOCALE_INFO: Readonly<Record<Locale, LocaleInfo>> = {
  en: { name: 'English', ogLocale: 'en_US' },
  de: { name: 'Deutsch', ogLocale: 'de_DE' },
  tr: { name: 'Türkçe', ogLocale: 'tr_TR' },
};

/**
 * Type guard for locale codes coming from route params or the DOM.
 */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Root-relative path of a locale's page: "/" for English, "/de/" for German.
 */
export function localePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '/' : `/${locale}/`;
}

/**
 * The text fields of a content entry in one locale. English is the entry itself; other
 * locales come from its `translations` block, so a missing optional field never falls
 * back to English.
 */
export function textIn<T>(
  base: NoInfer<T>,
  translations: Readonly<Record<TranslatedLocale, T>>,
  locale: Locale,
): T {
  return locale === 'en' ? base : translations[locale];
}

// ── Interface copy ──

/** Every string the page shows that does not come from the content collections. */
export interface Messages {
  skipToContent: string;
  scenesNav: string;
  sceneLabels: Readonly<Record<SceneId, string>>;
  sceneProgress: (position: number, total: number) => string;
  language: string;
  seeTheWork: string;
  scrollHint: string;
  archived: string;
  source: string;
  viewOnGitHub: string;
  visitSite: string;
  visit: string;
  openProject: (title: string) => string;
  imageAlt: (title: string, visual: 'screenshot' | 'icon') => string;
  greeting: string;
  from: string;
  speaks: string;
  next: string;
  sayHi: string;
  and: string;
  usedIn: (list: string) => string;
  unused: string;
  tagline: string;
}

const EN: Messages = {
  skipToContent: 'Skip to content',
  scenesNav: 'Scenes',
  sceneLabels: { intro: 'Intro', work: 'Work', stack: 'Stack', me: 'Me' },
  sceneProgress: (position: number, total: number): string => `Scene ${position} of ${total}`,
  language: 'Language',
  seeTheWork: 'See the work',
  scrollHint: 'Scroll',
  archived: 'Archived',
  source: 'Source',
  viewOnGitHub: 'View on GitHub',
  visitSite: 'Visit the site',
  visit: 'Visit',
  openProject: (title: string): string => `Open ${title}`,
  imageAlt: (title: string, visual: 'screenshot' | 'icon'): string =>
    `${title} ${visual === 'icon' ? 'app icon' : 'screenshot'}`,
  greeting: "Hi, I'm",
  from: 'From',
  speaks: 'Speaks',
  next: 'Next',
  sayHi: 'Say hi on GitHub',
  and: 'and',
  usedIn: (list: string): string => `Used in ${list}.`,
  unused: 'In the toolbox, not in a listed project yet.',
  tagline: 'builds big, fast software, mostly in Rust.',
};

const DE: Messages = {
  skipToContent: 'Zum Inhalt springen',
  scenesNav: 'Szenen',
  sceneLabels: { intro: 'Intro', work: 'Projekte', stack: 'Stack', me: 'Ich' },
  sceneProgress: (position: number, total: number): string => `Szene ${position} von ${total}`,
  language: 'Sprache',
  seeTheWork: 'Zu den Projekten',
  scrollHint: 'Scrollen',
  archived: 'Archiviert',
  source: 'Quellcode',
  viewOnGitHub: 'Auf GitHub ansehen',
  visitSite: 'Zur Website',
  visit: 'Öffnen',
  openProject: (title: string): string => `${title} öffnen`,
  imageAlt: (title: string, visual: 'screenshot' | 'icon'): string =>
    `${visual === 'icon' ? 'App-Icon' : 'Screenshot'} von ${title}`,
  greeting: 'Hallo, ich bin',
  from: 'Herkunft',
  speaks: 'Sprachen',
  next: 'Als Nächstes',
  sayHi: 'Sag Hallo auf GitHub',
  and: 'und',
  usedIn: (list: string): string => `Verwendet in ${list}.`,
  unused: 'Im Werkzeugkasten, noch in keinem gelisteten Projekt.',
  tagline: 'baut große, schnelle Software, meist in Rust.',
};

const TR: Messages = {
  skipToContent: 'İçeriğe geç',
  scenesNav: 'Sahneler',
  sceneLabels: { intro: 'Giriş', work: 'Projeler', stack: 'Araçlar', me: 'Ben' },
  sceneProgress: (position: number, total: number): string => `Sahne ${position} / ${total}`,
  language: 'Dil',
  seeTheWork: 'Projelere göz at',
  scrollHint: 'Kaydır',
  archived: 'Arşivlendi',
  source: 'Kaynak kod',
  viewOnGitHub: "GitHub'da görüntüle",
  visitSite: 'Siteyi ziyaret et',
  visit: 'Aç',
  openProject: (title: string): string => `${title} projesini aç`,
  imageAlt: (title: string, visual: 'screenshot' | 'icon'): string =>
    `${title} ${visual === 'icon' ? 'uygulama simgesi' : 'ekran görüntüsü'}`,
  greeting: 'Merhaba, ben',
  from: 'Köken',
  speaks: 'Diller',
  next: 'Sırada',
  sayHi: "GitHub'da merhaba de",
  and: 've',
  usedIn: (list: string): string => `Kullanıldığı projeler: ${list}.`,
  unused: 'Araç kutusunda, henüz listelenen bir projede değil.',
  tagline: 'büyük ve hızlı yazılımlar geliştiriyor, çoğunlukla Rust ile.',
};

export const MESSAGES: Readonly<Record<Locale, Messages>> = { en: EN, de: DE, tr: TR };
