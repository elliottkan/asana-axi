import { callTool } from '../mcp/client.js';
import { TOOLS } from '../config.js';
import { field, renderList, renderDetail, renderOutput, renderHelp } from '../format/toon.js';
import { parseFlags, one, positiveInt } from '../flags.js';
import { usageError } from '../errors.js';
import { getSuggestions } from '../suggestions.js';
import { listItems, asItem, plural } from './helpers.js';

const LIST_FIELDS = [field('gid'), field('name'), field('assignee'), field('due_date'), field('completed')];
const FULL_FIELDS = [
  field('gid'),
  field('name'),
  field('assignee'),
  field('due_date'),
  field('completed'),
  field('notes'),
  field('permalink_url'),
];

export const TASKS_HELP = `usage: asana-axi tasks [flags]
       asana-axi tasks get <gid>
       asana-axi tasks mine [--completed]
       asana-axi tasks search "<query>" [flags]
       asana-axi tasks create "<name>" [flags]
       asana-axi tasks update <gid> [flags]
       asana-axi tasks delete <gid>
       asana-axi tasks comment <gid> "<text>"

List/filter flags: --project X, --section X, --tag X, --assignee X, --completed
Search flags:      --assignee X, --due-date X, --project X (Premium only)
Create flags:      --project X, --assignee X, --due-date X, --description X
Update flags:      --name X, --assignee X, --completed, --incomplete
Common flags:      --full, --fields (comma-separated field list)

examples:
  asana-axi tasks --project 123
  asana-axi tasks mine
  asana-axi tasks search "launch plan" --assignee me
  asana-axi tasks create "Ship it" --project 123 --due-date 2026-10-01
  asana-axi tasks update 456 --completed
  asana-axi tasks comment 456 "Done, see PR #12"`;

function fieldsFor(flags: ReturnType<typeof parseFlags>): typeof LIST_FIELDS {
  const custom = one(flags, 'fields');
  if (custom) return custom.split(',').map((f) => field(f.trim()));
  return flags.booleans.has('full') ? FULL_FIELDS : LIST_FIELDS;
}

function renderTaskList(items: Record<string, unknown>[], flags: ReturnType<typeof parseFlags>): string {
  if (items.length === 0) {
    return renderOutput(['0 tasks found', renderHelp(getSuggestions({ domain: 'tasks', action: 'list', isEmpty: true }))]);
  }
  return renderOutput([
    plural(items.length, 'task'),
    renderList('tasks', items, fieldsFor(flags)),
    renderHelp(getSuggestions({ domain: 'tasks', action: 'list', isEmpty: false })),
  ]);
}

async function listCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {
    value: ['project', 'section', 'tag', 'assignee', 'fields'],
    boolean: ['full', 'completed'],
  });
  const mcpArgs: Record<string, unknown> = {};
  if (one(flags, 'project')) mcpArgs.project = one(flags, 'project');
  if (one(flags, 'section')) mcpArgs.section = one(flags, 'section');
  if (one(flags, 'tag')) mcpArgs.tag = one(flags, 'tag');
  if (one(flags, 'assignee')) mcpArgs.assignee = one(flags, 'assignee');
  if (flags.booleans.has('completed')) mcpArgs.is_completed = true;
  const result = await callTool(TOOLS.getTasks, mcpArgs);
  return renderTaskList(listItems(result, 'tasks'), flags);
}

async function getCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, { boolean: ['full'] });
  const gid = flags.positionals[0];
  if (!gid) throw usageError('tasks get requires a task gid', ['Run `asana-axi tasks get <gid>`']);
  const result = await callTool(TOOLS.getTask, { gid });
  const item = asItem(result);
  return renderOutput([
    renderDetail('task', item, flags.booleans.has('full') ? FULL_FIELDS : FULL_FIELDS),
    renderHelp([`asana-axi tasks update ${gid} --completed`, `asana-axi tasks comment ${gid} "<text>"`]),
  ]);
}

async function mineCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, { boolean: ['full', 'completed'], value: ['fields'] });
  const mcpArgs: Record<string, unknown> = {};
  if (flags.booleans.has('completed')) mcpArgs.is_completed = true;
  const result = await callTool(TOOLS.getMyTasks, mcpArgs);
  return renderTaskList(listItems(result, 'tasks'), flags);
}

async function searchCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, { value: ['assignee', 'due-date', 'project', 'fields'], boolean: ['full'] });
  const query = flags.positionals.join(' ').trim();
  if (!query) throw usageError('tasks search requires a query', ['Run `asana-axi tasks search "<query>"`']);
  const mcpArgs: Record<string, unknown> = { query };
  if (one(flags, 'assignee')) mcpArgs.assignee = one(flags, 'assignee');
  if (one(flags, 'due-date')) mcpArgs.due_date = one(flags, 'due-date');
  if (one(flags, 'project')) mcpArgs.project = one(flags, 'project');
  const result = await callTool(TOOLS.searchTasks, mcpArgs);
  return renderTaskList(listItems(result, 'tasks'), flags);
}

async function createCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, { value: ['project', 'assignee', 'due-date', 'description'] });
  const name = flags.positionals.join(' ').trim();
  if (!name) throw usageError('tasks create requires a name', ['Run `asana-axi tasks create "<name>"`']);
  const task: Record<string, unknown> = { name };
  if (one(flags, 'project')) task.project = one(flags, 'project');
  if (one(flags, 'assignee')) task.assignee = one(flags, 'assignee');
  if (one(flags, 'due-date')) task.due_date = one(flags, 'due-date');
  if (one(flags, 'description')) task.description = one(flags, 'description');
  const result = await callTool(TOOLS.createTasks, { tasks: [task] });
  const created = listItems(result, 'tasks')[0] ?? asItem(result);
  return renderOutput([
    renderDetail('task', created, FULL_FIELDS),
    renderHelp(['asana-axi tasks get <gid> to view the created task']),
  ]);
}

async function updateCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {
    value: ['name', 'assignee'],
    boolean: ['completed', 'incomplete'],
  });
  const gid = flags.positionals[0];
  if (!gid) throw usageError('tasks update requires a task gid', ['Run `asana-axi tasks update <gid> [flags]`']);
  if (flags.booleans.has('completed') && flags.booleans.has('incomplete')) {
    throw usageError('--completed and --incomplete are mutually exclusive');
  }
  const task: Record<string, unknown> = { gid };
  if (one(flags, 'name')) task.name = one(flags, 'name');
  if (one(flags, 'assignee')) task.assignee = one(flags, 'assignee');
  if (flags.booleans.has('completed')) task.is_completed = true;
  if (flags.booleans.has('incomplete')) task.is_completed = false;
  const result = await callTool(TOOLS.updateTasks, { tasks: [task] });
  const updated = listItems(result, 'tasks')[0] ?? asItem(result);
  return renderOutput([renderDetail('task', updated, FULL_FIELDS)]);
}

async function deleteCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const gid = flags.positionals[0];
  if (!gid) throw usageError('tasks delete requires a task gid', ['Run `asana-axi tasks delete <gid>`']);
  await callTool(TOOLS.deleteTask, { gid });
  return renderOutput([`task ${gid} deleted`]);
}

async function commentCommand(args: string[]): Promise<string> {
  const flags = parseFlags(args, {});
  const [gid, ...rest] = flags.positionals;
  const text = rest.join(' ').trim();
  if (!gid || !text) {
    throw usageError('tasks comment requires a task gid and text', ['Run `asana-axi tasks comment <gid> "<text>"`']);
  }
  await callTool(TOOLS.addComment, { gid, text });
  return renderOutput([`comment added to task ${gid}`]);
}

export async function tasksCommand(args: string[]): Promise<string> {
  const [sub, ...rest] = args;
  switch (sub) {
    case undefined:
      return listCommand([]);
    case 'get':
      return getCommand(rest);
    case 'mine':
      return mineCommand(rest);
    case 'search':
      return searchCommand(rest);
    case 'create':
      return createCommand(rest);
    case 'update':
      return updateCommand(rest);
    case 'delete':
      return deleteCommand(rest);
    case 'comment':
      return commentCommand(rest);
    default:
      if (sub.startsWith('-')) return listCommand(args);
      throw usageError(`Unknown tasks subcommand "${sub}"`, ['Run `asana-axi help tasks`']);
  }
}
