import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderOutput } from '../format/toon.js';
import { parseFlags } from '../flags.js';
import { usageError } from '../errors.js';
import { listItems, plural } from './helpers.js';

const LIST_FIELDS = [field('gid'), field('name'), field('view_url'), field('download_url')];

export const ATTACHMENTS_HELP = `usage: asana-axi attachments <gid>

Lists attachments on a task (pass the task's gid).`;

export async function attachmentsCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const gid = flags.positionals[0];
  if (!gid) throw usageError('attachments requires a task gid', ['Run `asana-axi attachments <gid>`']);
  const result = await callTool(TOOLS.getAttachments, { gid });
  const items = listItems(result, 'attachments');
  if (items.length === 0) return renderOutput(['0 attachments found']);
  return renderOutput([plural(items.length, 'attachment'), renderList('attachments', items, LIST_FIELDS)]);
}
