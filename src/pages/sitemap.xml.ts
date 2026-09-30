import type { APIContext } from 'astro';
import { DEFAULT_LOCALE, LOCALES, localePath, type Locale } from '../lib/i18n';
import { DEFAULT_SITE } from '../lib/site';

/**
 * One URL per language, each listing all of them as hreflang alternates. The four scenes
 * share a page; lastmod is the build date.
 */
export function GET(context: APIContext): Response {
  const site: URL = context.site ?? DEFAULT_SITE;
  const lastmod: string = new Date().toISOString().slice(0, 10);
  const href = (locale: Locale): string => new URL(localePath(locale), site).href;
  const alternates: string[] = [
    ...LOCALES.map(
      (locale: Locale): string =>
        `    <xhtml:link rel="alternate" hreflang="${locale}" href="${href(locale)}"/>`,
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${href(DEFAULT_LOCALE)}"/>`,
  ];
  const urls: string[] = LOCALES.map((locale: Locale): string =>
    [
      '  <url>',
      `    <loc>${href(locale)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      ...alternates,
      '  </url>',
    ].join('\n'),
  );
  const body: string = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
