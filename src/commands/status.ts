import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput } from '../format/toon.js';
import { parseFlags } from '../flags.js';
import { usageError } from '../errors.js';
import { listItems, plural } from './helpers.js';

const LIST_FIELDS = [field('gid'), field('title'), field('status_color'), field('created_at')];

export const STATUS_HELP = `usage: asana-axi status "<keyword>"

Searches project status updates by keyword.

example:
  asana-axi status "launch"`;

export async function statusCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const keyword = flags.positionals.join(' ').trim();
  if (!keyword) throw usageError('status requires a keyword', ['Run `asana-axi status "<keyword>"`']);
  const result = await callTool(TOOLS.getStatusOverview, { keyword });
  const items = listItems(result, 'status_updates');
  if (items.length === 0) return renderOutput(['0 status updates found']);
  return renderOutput([plural(items.length, 'status update'), renderList('status_updates', items, LIST_FIELDS)]);
}
