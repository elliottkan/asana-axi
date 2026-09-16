import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderDetail, renderOutput } from '../format/toon.js';
import { parseFlags } from '../flags.js';
import { usageError } from '../errors.js';
import { listItems, asItem, plural } from './helpers.js';

const LIST_FIELDS = [field('gid'), field('name')];

export const AGENTS_HELP = `usage: asana-axi agents
       asana-axi agents get <gid>

Lists AI agents/apps registered in the workspace.`;

async function listCommand(): Promise<string> {
  const result = await callTool(TOOLS.getWorkspaceAgents, {});
  const items = listItems(result, 'agents');
  if (items.length === 0) return renderOutput(['0 agents found']);
  return renderOutput([plural(items.length, 'agent'), renderList('agents', items, LIST_FIELDS)]);
}

async function getCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const gid = flags.positionals[0];
  if (!gid) throw usageError('agents get requires an agent gid', ['Run `asana-axi agents get <gid>`']);
  const result = await callTool(TOOLS.getAgent, { gid });
  return renderOutput([renderDetail('agent', asItem(result), LIST_FIELDS)]);
}

export async function agentsCommand(args: string[]): Promise<string> {
  const [sub, ...rest] = args;
  if (sub === undefined) return listCommand();
  if (sub === 'get') return getCommand(rest);
  throw usageError(`Unknown agents subcommand "${sub}"`, ['Run `asana-axi help agents`']);
}
