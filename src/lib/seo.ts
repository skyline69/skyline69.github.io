// ── Structured data (JSON-LD) ──

/** Any value that survives JSON.stringify unchanged. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface SeoPerson {
  name: string;
  handle: string;
  siteUrl: string;
  githubUrl: string;
  description: string;
  knowsAbout: readonly string[];
}

export interface SeoProject {
  title: string;
  description: string;
  repoUrl: string;
  siteUrl?: string | undefined;
  languages: readonly string[];
  archived: boolean;
}

/**
 * Build a JSON-LD graph: the page as a ProfilePage on a WebSite, the site owner as its
 * Person, and each project as SoftwareSourceCode.
 */
export function buildJsonLd(person: SeoPerson, projects: readonly SeoProject[]): JsonValue {
  const personId: string = `${person.siteUrl}#person`;
  const websiteId: string = `${person.siteUrl}#website`;
  const title: string = `${person.name} (${person.handle})`;

  const websiteNode: JsonValue = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: person.siteUrl,
    name: title,
    inLanguage: 'en',
    publisher: { '@id': personId },
  };

  const pageNode: JsonValue = {
    '@type': 'ProfilePage',
    '@id': `${person.siteUrl}#page`,
    url: person.siteUrl,
    name: title,
    description: person.description,
    inLanguage: 'en',
    isPartOf: { '@id': websiteId },
    mainEntity: { '@id': personId },
  };

  const personNode: JsonValue = {
    '@type': 'Person',
    '@id': personId,
    name: person.name,
    alternateName: person.handle,
    url: person.siteUrl,
    description: person.description,
    sameAs: [person.githubUrl],
    knowsAbout: [...person.knowsAbout],
  };

  const projectNodes: JsonValue[] = projects.map((project: SeoProject): JsonValue => {
    const node: { [key: string]: JsonValue } = {
      '@type': 'SoftwareSourceCode',
      name: project.title,
      description: project.description,
      codeRepository: project.repoUrl,
      url: project.siteUrl ?? project.repoUrl,
      programmingLanguage: [...project.languages],
      author: { '@id': personId },
    };
    if (project.archived) {
      node['creativeWorkStatus'] = 'Archived';
    }
    return node;
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [websiteNode, pageNode, personNode, ...projectNodes],
  };
}

/**
 * Serialize JSON-LD for an inline script tag. Escapes "<" so the payload cannot close the tag.
 */
export function serializeJsonLd(data: JsonValue): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
