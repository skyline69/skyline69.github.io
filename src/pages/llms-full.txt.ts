import type { APIContext } from 'astro';
import { buildMarkdownBody } from '../lib/agents';
import { DEFAULT_SITE, loadAgentSite } from '../lib/site';

/**
 * llms-full.txt: the whole page as Markdown, without front matter.
 */
export async function GET(context: APIContext): Promise<Response> {
  const body: string = buildMarkdownBody(await loadAgentSite(context.site ?? DEFAULT_SITE));
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
