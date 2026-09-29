import type { APIContext } from 'astro';
import { buildMarkdown } from '../lib/agents';
import { DEFAULT_SITE, loadAgentSite } from '../lib/site';

/**
 * The page as Markdown, for agents that send `Accept: text/markdown` or follow the
 * `rel="alternate"` link.
 */
export async function GET(context: APIContext): Promise<Response> {
  const site: URL = context.site ?? DEFAULT_SITE;
  const body: string = buildMarkdown(await loadAgentSite(site), new URL('/og.png', site).href);
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
