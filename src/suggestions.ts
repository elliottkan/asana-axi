export interface SuggestionCtx {
  domain: string;
  action: string;
  isEmpty: boolean;
}

const table: Array<{ match: (c: SuggestionCtx) => boolean; lines: (c: SuggestionCtx) => string[] }> = [
  {
    match: (c) => c.domain === 'home',
    lines: () => [
      'Run `asana-axi tasks mine` to see your open tasks',
      'Run `asana-axi projects` to list projects, or `asana-axi search "<query>"` to find anything',
    ],
  },
  {
    match: (c) => c.domain === 'tasks' && !c.isEmpty,
    lines: () => [
      'Run `asana-axi tasks get <gid>` for full task detail',
      'Run `asana-axi tasks update <gid> --completed` to close a task',
    ],
  },
  {
    match: (c) => c.domain === 'tasks' && c.isEmpty,
    lines: () => ['Try a different --project, --assignee, or --tag filter'],
  },
  {
    match: (c) => c.domain === 'projects' && !c.isEmpty,
    lines: () => ['Run `asana-axi projects get <gid>` for full project detail'],
  },
  {
    match: (c) => c.domain === 'projects' && c.isEmpty,
    lines: () => ['Try a different --team filter, or drop --archived'],
  },
  {
    match: (c) => c.domain === 'portfolios' && !c.isEmpty,
    lines: () => ['Run `asana-axi portfolios items <gid>` to see what is inside it'],
  },
  {
    match: (c) => c.domain === 'search',
    lines: () => ['Narrow with --type task|project|portfolio|tag|user'],
  },
];

export function getSuggestions(ctx: SuggestionCtx): string[] {
  for (const e of table) if (e.match(ctx)) return e.lines(ctx);
  return [];
}
