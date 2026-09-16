import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderDetail, renderOutput, renderHelp } from '../format/toon.js';
import { parseFlags, one } from '../flags.js';
import { usageError } from '../errors.js';
import { getSuggestions } from '../suggestions.js';
import { listItems, asItem, plural } from './helpers.js';

const LIST_FIELDS = [field('gid'), field('name'), field('team'), field('archived')];
const FULL_FIELDS = [field('gid'), field('name'), field('team'), field('archived'), field('notes'), field('permalink_url')];

export const PROJECTS_HELP = `usage: asana-axi projects [--team X] [--archived]
       asana-axi projects get <gid>
       asana-axi projects create "<name>"
       asana-axi projects status <gid> "<title>" "<body>" [--color green|yellow|red]

examples:
  asana-axi projects --team 123
  asana-axi projects get 456
  asana-axi projects create "Q4 Launch"
  asana-axi projects status 456 "On track" "Shipping Friday" --color green`;

function fieldsFor(flags: ReturnType<typeof parseFlags>): typeof LIST_FIELDS {
  const custom = one(flags, 'fields');
  if (custom) return custom.split(',').map((f) => field(f.trim()));
  return flags.booleans.has('full') ? FULL_FIELDS : LIST_FIELDS;
}

async function listCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, { value: ['team', 'fields'], boolean: ['full', 'archived'] });
  const mcpArgs: Record<string, unknown> = {};
  if (one(flags, 'team')) mcpArgs.team = one(flags, 'team');
  if (flags.booleans.has('archived')) mcpArgs.archived = true;
  const result = await callTool(TOOLS.getProjects, mcpArgs);
  const items = listItems(result, 'projects');
  if (items.length === 0) {
    return renderOutput(['0 projects found', renderHelp(getSuggestions({ domain: 'projects', action: 'list', isEmpty: true }))]);
  }
  return renderOutput([
    plural(items.length, 'project'),
    renderList('projects', items, fieldsFor(flags)),
    renderHelp(getSuggestions({ domain: 'projects', action: 'list', isEmpty: false })),
  ]);
}

async function getCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const gid = flags.positionals[0];
  if (!gid) throw usageError('projects get requires a project gid', ['Run `asana-axi projects get <gid>`']);
  const result = await callTool(TOOLS.getProject, { gid });
  return renderOutput([renderDetail('project', asItem(result), FULL_FIELDS)]);
}

async function createCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const name = flags.positionals.join(' ').trim();
  if (!name) throw usageError('projects create requires a name', ['Run `asana-axi projects create "<name>"`']);
  const result = await callTool(TOOLS.createProject, { name });
  return renderOutput([renderDetail('project', asItem(result), FULL_FIELDS)]);
}

async function statusCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, { value: ['color'] });
  const [gid, title, body] = flags.positionals;
  if (!gid || !title || !body) {
    throw usageError('projects status requires <gid> "<title>" "<body>"', [
      'Run `asana-axi projects status <gid> "<title>" "<body>"`',
    ]);
  }
  const color = one(flags, 'color');
  if (color && !['green', 'yellow', 'red'].includes(color)) {
    throw usageError(`--color must be one of green, yellow, red, got "${color}"`);
  }
  const mcpArgs: Record<string, unknown> = { gid, title, body_text: body };
  if (color) mcpArgs.status_color = color;
  const result = await callTool(TOOLS.createProjectStatusUpdate, mcpArgs);
  return renderOutput([renderDetail('status_update', asItem(result), [field('gid'), field('title'), field('status_color')])]);
}

export async function projectsCommand(args: string[]): Promise<string> {
  const [sub, ...rest] = args;
  switch (sub) {
    case undefined:
      return listCommand([]);
    case 'get':
      return getCommand(rest);
    case 'create':
      return createCommand(rest);
    case 'status':
      return statusCommand(rest);
    default:
      if (sub.startsWith('-')) return listCommand(args);
      throw usageError(`Unknown projects subcommand "${sub}"`, ['Run `asana-axi help projects`']);
  }
}
