import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderDetail, renderOutput, renderHelp } from '../format/toon.js';
import { parseFlags } from '../flags.js';
import { usageError } from '../errors.js';
import { listItems, asItem, plural } from './helpers.js';

const LIST_FIELDS = [field('gid'), field('name'), field('email')];
const DETAIL_FIELDS = [field('gid'), field('name'), field('email'), field('photo')];

export const USERS_HELP = `usage: asana-axi users [--team X]
       asana-axi users get <me|gid|email>
       asana-axi users me

examples:
  asana-axi users --team 123
  asana-axi users get me
  asana-axi users get someone@example.com`;

export async function meCommand(): Promise<string> {
  const result = await callTool(TOOLS.getMe, {});
  return renderOutput([renderDetail('user', asItem(result), DETAIL_FIELDS)]);
}

async function listCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, { value: ['team'] });
  const mcpArgs: Record<string, unknown> = {};
  if (flags.values.team?.[0]) mcpArgs.team = flags.values.team[0];
  const result = await callTool(TOOLS.getUsers, mcpArgs);
  const items = listItems(result, 'users');
  if (items.length === 0) return renderOutput(['0 users found']);
  return renderOutput([plural(items.length, 'user'), renderList('users', items, LIST_FIELDS), renderHelp(['asana-axi users get <gid>'])]);
}

async function getCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const identifier = flags.positionals[0];
  if (!identifier) throw usageError('users get requires me, a gid, or an email', ['Run `asana-axi users get me`']);
  const result = await callTool(TOOLS.getUser, { gid: identifier });
  return renderOutput([renderDetail('user', asItem(result), DETAIL_FIELDS)]);
}

export async function usersCommand(args: string[]): Promise<string> {
  const [sub, ...rest] = args;
  switch (sub) {
    case undefined:
      return listCommand([]);
    case 'get':
      return getCommand(rest);
    case 'me':
      return meCommand();
    default:
      if (sub.startsWith('-')) return listCommand(args);
      throw usageError(`Unknown users subcommand "${sub}"`, ['Run `asana-axi help users`']);
  }
}
