import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderDetail, renderOutput, renderHelp } from '../format/toon.js';
import { parseFlags } from '../flags.js';
import { usageError } from '../errors.js';
import { getSuggestions } from '../suggestions.js';
import { listItems, asItem, plural } from './helpers.js';

const LIST_FIELDS = [field('gid'), field('name'), field('owner')];
const ITEM_FIELDS = [field('gid'), field('name'), field('resource_type')];

export const PORTFOLIOS_HELP = `usage: asana-axi portfolios
       asana-axi portfolios get <gid>
       asana-axi portfolios items <gid>

examples:
  asana-axi portfolios
  asana-axi portfolios get 123
  asana-axi portfolios items 123`;

async function listCommand(): Promise<string> {
  const result = await callTool(TOOLS.getPortfolios, {});
  const items = listItems(result, 'portfolios');
  if (items.length === 0) {
    return renderOutput(['0 portfolios found', renderHelp(getSuggestions({ domain: 'portfolios', action: 'list', isEmpty: true }))]);
  }
  return renderOutput([
    plural(items.length, 'portfolio'),
    renderList('portfolios', items, LIST_FIELDS),
    renderHelp(getSuggestions({ domain: 'portfolios', action: 'list', isEmpty: false })),
  ]);
}

async function getCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const gid = flags.positionals[0];
  if (!gid) throw usageError('portfolios get requires a portfolio gid', ['Run `asana-axi portfolios get <gid>`']);
  const result = await callTool(TOOLS.getPortfolio, { gid });
  return renderOutput([renderDetail('portfolio', asItem(result), [...LIST_FIELDS, field('permalink_url')])]);
}

async function itemsCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const gid = flags.positionals[0];
  if (!gid) throw usageError('portfolios items requires a portfolio gid', ['Run `asana-axi portfolios items <gid>`']);
  const result = await callTool(TOOLS.getItemsForPortfolio, { gid });
  const items = listItems(result, 'items');
  if (items.length === 0) return renderOutput(['0 items found']);
  return renderOutput([plural(items.length, 'item'), renderList('items', items, ITEM_FIELDS)]);
}

export async function portfoliosCommand(args: string[]): Promise<string> {
  const [sub, ...rest] = args;
  switch (sub) {
    case undefined:
      return listCommand();
    case 'get':
      return getCommand(rest);
    case 'items':
      return itemsCommand(rest);
    default:
      throw usageError(`Unknown portfolios subcommand "${sub}"`, ['Run `asana-axi help portfolios`']);
  }
}
