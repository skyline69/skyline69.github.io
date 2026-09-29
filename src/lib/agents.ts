import { formatUsedIn } from './stack';

// ── Machine-readable views of the site: robots.txt, Markdown, llms.txt ──

/** One project as agents see it. */
export interface AgentProject {
  title: string;
  description: string;
  tags: readonly string[];
  repoUrl: string;
  siteUrl?: string | undefined;
  archived: boolean;
  note?: string | undefined;
}

/** One tool in the stack, with the projects that use it. */
export interface AgentTool {
  name: string;
  url: string;
  usedIn: readonly string[];
}

/** One "off the keyboard" card. */
export interface AgentCard {
  title: string;
  body: string;
  accent?: string | undefined;
}

/** Everything on the page, as plain data. */
export interface AgentSite {
  /** Absolute URL of the site root, with a trailing slash. */
  url: string;
  title: string;
  description: string;
  name: string;
  headline: string;
  intro: string;
  summary: readonly string[];
  origin: string;
  languages: readonly string[];
  next: string;
  githubUrl: string;
  projects: readonly AgentProject[];
  stack: readonly AgentTool[];
  cards: readonly AgentCard[];
}

/** Paths of the agent files, relative to the site root. */
export const AGENT_PATHS = {
  markdown: '/index.md',
  llms: '/llms.txt',
  llmsFull: '/llms-full.txt',
  sitemap: '/sitemap.xml',
} as const;

/** What the site allows automated clients to do with its content. */
export interface ContentSignals {
  search: boolean;
  aiInput: boolean;
  aiTrain: boolean;
}

/** AI crawlers named explicitly in robots.txt, so each one sees the rules meant for it. */
export const AI_CRAWLERS: readonly string[] = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Amazonbot',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'CCBot',
  'Bytespider',
  'cohere-ai',
  'MistralAI-User',
  'DuckAssistBot',
];

/** Cloudflare's Content Signals Policy text, which gives the signals their legal meaning. */
const SIGNALS_POLICY: readonly string[] = [
  '# As a condition of accessing this website, you agree to abide by the following',
  '# content signals:',
  '#',
  '# (a)  If a content-signal = yes, you may collect content for the corresponding',
  '#      use.',
  '# (b)  If a content-signal = no, you may not collect content for the',
  '#      corresponding use.',
  '# (c)  If the website operator does not include a content signal for a',
  '#      corresponding use, the website operator neither grants nor restricts',
  '#      permission via content signal with respect to the corresponding use.',
  '#',
  '# The content signals and their meanings are:',
  '#',
  '# search:   building a search index and providing search results (e.g., returning',
  "#           hyperlinks and short excerpts from your website's contents). Search does not",
  '#           include providing AI-generated search summaries.',
  '# ai-input: inputting content into one or more AI models (e.g., retrieval',
  '#           augmented generation, grounding, or other real-time taking of content for',
  '#           generative AI search answers).',
  '# ai-train: training or fine-tuning AI models.',
  '#',
  '# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS RESERVATIONS OF',
  '# RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN UNION DIRECTIVE 2019/790 ON COPYRIGHT',
  '# AND RELATED RIGHTS IN THE DIGITAL SINGLE MARKET.',
];

function yesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}

/**
 * The `Content-Signal` value, e.g. "search=yes, ai-input=yes, ai-train=no".
 */
export function formatContentSignal(signals: ContentSignals): string {
  return [
    `search=${yesNo(signals.search)}`,
    `ai-input=${yesNo(signals.aiInput)}`,
    `ai-train=${yesNo(signals.aiTrain)}`,
  ].join(', ');
}

/**
 * robots.txt: the Content Signals Policy, one group for all crawlers and one naming the AI
 * crawlers. A crawler only reads the most specific group that matches it, so both groups
 * carry the same signals.
 */
export function buildRobotsTxt(siteUrl: string, signals: ContentSignals): string {
  const signal: string = `Content-Signal: ${formatContentSignal(signals)}`;
  return [
    ...SIGNALS_POLICY,
    '',
    'User-agent: *',
    signal,
    'Allow: /',
    '',
    '# AI crawlers and assistants: welcome.',
    ...AI_CRAWLERS.map((agent: string): string => `User-agent: ${agent}`),
    signal,
    'Allow: /',
    '',
    `Sitemap: ${new URL(AGENT_PATHS.sitemap, siteUrl).href}`,
    '',
  ].join('\n');
}

// ── Markdown ──

function link(label: string, url: string): string {
  return `[${label}](${url})`;
}

/** YAML string, quoted so colons and other characters stay literal. */
function yaml(value: string): string {
  return JSON.stringify(value);
}

function projectSection(project: AgentProject): string[] {
  const lines: string[] = [`### ${project.title}`, '', project.description, ''];
  if (project.archived) {
    lines.push(`- Status: ${project.note ?? 'Archived.'}`);
  }
  if (project.tags.length > 0) {
    lines.push(`- Built with: ${project.tags.join(', ')}`);
  }
  if (project.siteUrl !== undefined) {
    lines.push(`- Site: ${project.siteUrl}`);
  }
  lines.push(`- Source: ${project.repoUrl}`, '');
  return lines;
}

function cardLine(card: AgentCard): string {
  const text: string = card.accent === undefined ? card.body : `${card.body} ${card.accent}`;
  return `- **${card.title}**: ${text}`;
}

/**
 * The page body as Markdown: intro, work, stack and about, in the order the stage shows them.
 */
export function buildMarkdownBody(site: AgentSite): string {
  return [
    `# ${site.title}`,
    '',
    site.headline,
    '',
    site.intro,
    '',
    '## Work',
    '',
    ...site.projects.flatMap(projectSection),
    '## Stack',
    '',
    ...site.stack.map(
      (tool: AgentTool): string => `- ${link(tool.name, tool.url)}: ${formatUsedIn(tool.usedIn)}`,
    ),
    '',
    `## About ${site.name}`,
    '',
    ...site.summary.flatMap((text: string): string[] => [text, '']),
    `- From: ${site.origin}`,
    `- Speaks: ${site.languages.join(', ')}`,
    `- Next: ${site.next}`,
    '',
    '### Beyond code',
    '',
    ...site.cards.map(cardLine),
    '',
    '## Links',
    '',
    `- Website: ${site.url}`,
    `- GitHub: ${site.githubUrl}`,
    '',
  ].join('\n');
}

/**
 * The page as a Markdown document with YAML front matter, served at /index.md.
 */
export function buildMarkdown(site: AgentSite, imageUrl: string): string {
  return [
    '---',
    `title: ${yaml(site.title)}`,
    `description: ${yaml(site.description)}`,
    `url: ${yaml(site.url)}`,
    `image: ${yaml(imageUrl)}`,
    '---',
    '',
    buildMarkdownBody(site),
  ].join('\n');
}

/**
 * llms.txt (llmstxt.org): a short summary and a reading list for language models.
 */
export function buildLlmsTxt(site: AgentSite): string {
  const at = (path: string): string => new URL(path, site.url).href;
  return [
    `# ${site.title}`,
    '',
    `> ${site.description}`,
    '',
    `Personal site of ${site.name}. It is a single page; everything on it is also available as Markdown.`,
    '',
    '## Site',
    '',
    `- ${link('Full page as Markdown', at(AGENT_PATHS.markdown))}: projects, stack and about in one document`,
    `- ${link('Full text for language models', at(AGENT_PATHS.llmsFull))}: the same content without front matter`,
    '',
    '## Projects',
    '',
    ...site.projects.map(
      (project: AgentProject): string =>
        `- ${link(project.title, project.siteUrl ?? project.repoUrl)}: ${project.description}${project.archived ? ' (archived)' : ''}`,
    ),
    '',
    '## Optional',
    '',
    `- ${link('GitHub', site.githubUrl)}: all public repositories`,
    `- ${link('Sitemap', at(AGENT_PATHS.sitemap))}`,
    '',
  ].join('\n');
}
