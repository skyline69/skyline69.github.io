import type { APIContext } from 'astro';
import { buildRobotsTxt } from '../lib/agents';
import { DEFAULT_SITE } from '../lib/site';

/**
 * robots.txt with Content Signals and explicit rules for AI crawlers.
 */
export function GET(context: APIContext): Response {
  const body: string = buildRobotsTxt((context.site ?? DEFAULT_SITE).href, {
    search: true,
    aiInput: true,
    aiTrain: true,
  });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
