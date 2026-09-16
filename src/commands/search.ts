import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput, renderHelp } from '../format/toon.js';
import { parseFlags, one } from '../flags.js';
import { usageError } from '../errors.js';
import { getSuggestions } from '../suggestions.js';
import { listItems, plural } from './helpers.js';

const LIST_FIELDS = [field('gid'), field('name'), field('resource_type')];

export const SEARCH_HELP = `usage: asana-axi search "<query>" [--type task|project|portfolio|tag|user]

example:
  asana-axi search "launch plan" --type task`;

export async function searchCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, { value: ['type'] });
  const query = flags.positionals.join(' ').trim();
  if (!query) throw usageError('search requires a query', ['Run `asana-axi search "<query>"`']);
  const mcpArgs: Record<string, unknown> = { query };
  if (one(flags, 'type')) mcpArgs.type = one(flags, 'type');
  const result = await callTool(TOOLS.searchObjects, mcpArgs);
  const items = listItems(result, 'results');
  if (items.length === 0) {
    return renderOutput(['0 results found', renderHelp(getSuggestions({ domain: 'search', action: 'search', isEmpty: true }))]);
  }
  return renderOutput([
    plural(items.length, 'result'),
    renderList('results', items, LIST_FIELDS),
    renderHelp(getSuggestions({ domain: 'search', action: 'search', isEmpty: false })),
  ]);
}
