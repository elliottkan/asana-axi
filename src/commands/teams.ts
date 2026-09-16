import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput } from '../format/toon.js';
import { listItems, plural } from './helpers.js';

const LIST_FIELDS = [field('gid'), field('name')];

export const TEAMS_HELP = `usage: asana-axi teams

Lists teams in the workspace.`;

export async function teamsCommand(): Promise<string> {
  const result = await callTool(TOOLS.getTeams, {});
  const items = listItems(result, 'teams');
  if (items.length === 0) return renderOutput(['0 teams found']);
  return renderOutput([plural(items.length, 'team'), renderList('teams', items, LIST_FIELDS)]);
}
