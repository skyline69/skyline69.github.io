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
 * The first published locale among the reader's preferred languages (`navigator.languages`),
 * matched by language and ignoring region: "de-AT" counts as German. Null when none match.
 */
export function preferredLocale(languages: readonly string[]): Locale | null {
  for (const tag of languages) {
    const language: string = tag.toLowerCase().split('-')[0] ?? '';
    if (isLocale(language)) {
      return language;
    }
  }
  return null;
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

/** Error pages: the 404 GitHub Pages serves, and 5xx pages for Cloudflare to serve. */
export const ERROR_CODES = [404, 500, 502, 503, 504] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Server errors, which only Cloudflare can show (GitHub Pages never answers with a 5xx). */
export const SERVER_ERROR_CODES: readonly Exclude<ErrorCode, 404>[] = [500, 502, 503, 504];

/** Headline and one line of explanation for an error page. */
export interface ErrorCopy {
  title: string;
  body: string;
}

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
  errors: Readonly<Record<ErrorCode, ErrorCopy>>;
  backHome: string;
  tryAgain: string;
  langHint: string;
  langHintAction: string;
  dismiss: string;
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
  errors: {
    404: { title: 'Page not found', body: 'This page went up in smoke.' },
    500: {
      title: 'Something broke',
      body: 'Something went wrong on my end. Try again in a moment.',
    },
    502: {
      title: 'Bad gateway',
      body: 'The host behind this site sent back something broken. Try again in a moment.',
    },
    503: { title: 'Back soon', body: 'The site is down for a moment. Try again shortly.' },
    504: {
      title: 'Timed out',
      body: 'The host behind this site took too long to answer. Try again in a moment.',
    },
  },
  backHome: 'Back to the start',
  tryAgain: 'Try again',
  langHint: 'This page is also in English.',
  langHintAction: 'Read in English',
  dismiss: 'Dismiss',
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
  errors: {
    404: { title: 'Seite nicht gefunden', body: 'Diese Seite ist in Rauch aufgegangen.' },
    500: {
      title: 'Etwas ist kaputt',
      body: 'Bei mir ist etwas schiefgelaufen. Versuch es gleich noch einmal.',
    },
    502: {
      title: 'Fehlerhaftes Gateway',
      body: 'Der Host hinter dieser Seite hat eine fehlerhafte Antwort geschickt. Versuch es gleich noch einmal.',
    },
    503: {
      title: 'Gleich wieder da',
      body: 'Die Seite ist kurz nicht erreichbar. Versuch es gleich noch einmal.',
    },
    504: {
      title: 'Zeitüberschreitung',
      body: 'Der Host hinter dieser Seite hat zu lange gebraucht. Versuch es gleich noch einmal.',
    },
  },
  backHome: 'Zurück zum Anfang',
  tryAgain: 'Nochmal versuchen',
  langHint: 'Diese Seite gibt es auch auf Deutsch.',
  langHintAction: 'Auf Deutsch lesen',
  dismiss: 'Schließen',
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
  errors: {
    404: { title: 'Sayfa bulunamadı', body: 'Bu sayfa duman olup uçtu.' },
    500: {
      title: 'Bir şeyler bozuldu',
      body: 'Benim tarafımda bir sorun oluştu. Birazdan tekrar dene.',
    },
    502: {
      title: 'Hatalı ağ geçidi',
      body: 'Bu sitenin arkasındaki sunucu bozuk bir yanıt gönderdi. Birazdan tekrar dene.',
    },
    503: {
      title: 'Birazdan döneceğim',
      body: 'Site kısa bir süreliğine erişilemiyor. Birazdan tekrar dene.',
    },
    504: {
      title: 'Zaman aşımı',
      body: 'Bu sitenin arkasındaki sunucu yanıt vermekte çok gecikti. Birazdan tekrar dene.',
    },
  },
  backHome: 'Başa dön',
  tryAgain: 'Tekrar dene',
  langHint: 'Bu sayfa Türkçe olarak da var.',
  langHintAction: 'Türkçe oku',
  dismiss: 'Kapat',
};

export const MESSAGES: Readonly<Record<Locale, Messages>> = { en: EN, de: DE, tr: TR };
