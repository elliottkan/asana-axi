import { renderHelp, renderOutput } from './format/toon.js';
import { authStatus } from './auth/login.js';
import { callTool } from './mcp/client.js';
import { TOOLS } from './config.js';
import { getSuggestions } from './suggestions.js';

export async function homeCommand(): Promise<string> {
  const status = authStatus();
  if (!status.authenticated) {
    return renderOutput([
      'asana-axi: not authenticated',
      renderHelp(['Run `asana-axi login` to authenticate with Asana']),
    ]);
  }

  const me = (await callTool(TOOLS.getMe, {}).catch(() => undefined)) as
    | { name?: string; email?: string; gid?: string }
    | undefined;
  const myTasks = (await callTool(TOOLS.getMyTasks, { is_completed: false }).catch(() => undefined)) as
    | { tasks?: unknown[] }
    | { data?: unknown[] }
    | unknown[]
    | undefined;
  const taskCount = Array.isArray(myTasks)
    ? myTasks.length
    : ((myTasks as { tasks?: unknown[] })?.tasks?.length ?? (myTasks as { data?: unknown[] })?.data?.length ?? 0);

  return renderOutput([
    `whoami: ${me?.name ?? 'unknown'} (${me?.email ?? me?.gid ?? 'unknown'})`,
    `open tasks assigned to me: ${taskCount}`,
    renderHelp(getSuggestions({ domain: 'home', action: 'home', isEmpty: false })),
  ]);
}
