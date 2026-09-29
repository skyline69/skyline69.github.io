import type { APIContext } from 'astro';
import { DEFAULT_SITE } from '../lib/site';

/**
 * One-page sitemap. The four scenes share the root URL; lastmod is the build date.
 */
export function GET(context: APIContext): Response {
  const site: URL = context.site ?? DEFAULT_SITE;
  const lastmod: string = new Date().toISOString().slice(0, 10);
  const body: string = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${new URL('/', site).href}</loc><lastmod>${lastmod}</lastmod></url>`,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
