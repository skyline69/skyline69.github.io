import type { APIContext } from 'astro';
import { buildLlmsTxt } from '../lib/agents';
import { DEFAULT_SITE, loadAgentSite } from '../lib/site';

/**
 * llms.txt: summary and reading list for language models.
 */
export async function GET(context: APIContext): Promise<Response> {
  const body: string = buildLlmsTxt(await loadAgentSite(context.site ?? DEFAULT_SITE));
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
