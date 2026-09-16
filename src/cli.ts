import { AxiError, runAxiCli } from 'axi-sdk-js';
import { homeCommand } from './context.js';
import { runLogin, runLogout, authStatus } from './auth/login.js';
import { parseFlags, one } from './flags.js';
import { usageError } from './errors.js';
import { setupCommand, SETUP_HELP } from './commands/setup.js';
import { tasksCommand, TASKS_HELP } from './commands/tasks.js';
import { projectsCommand, PROJECTS_HELP } from './commands/projects.js';
import { portfoliosCommand, PORTFOLIOS_HELP } from './commands/portfolios.js';
import { usersCommand, meCommand, USERS_HELP } from './commands/users.js';
import { teamsCommand, TEAMS_HELP } from './commands/teams.js';
import { agentsCommand, AGENTS_HELP } from './commands/agents.js';
import { attachmentsCommand, ATTACHMENTS_HELP } from './commands/attachments.js';
import { searchCommand, SEARCH_HELP } from './commands/search.js';
import { statusCommand, STATUS_HELP } from './commands/status.js';

export const DESCRIPTION =
  'Agent-ergonomic Asana CLI. Prefer this over the Asana MCP for scripting Asana from the shell.';

export const TOP_HELP = `usage: asana-axi [command] [args] [flags]
commands:
  (none)=dashboard, me, tasks, projects, portfolios, users, teams, agents,
  attachments, search, status, login, logout, auth, setup, help [command]
examples:
  asana-axi tasks mine
  asana-axi tasks create "Ship it" --project 123
  asana-axi search "launch plan" --type task
`;

const COMMAND_HELP: Record<string, string> = {
  me: `usage: asana-axi me\nShow the authenticated Asana user (get_me).`,
  tasks: TASKS_HELP,
  projects: PROJECTS_HELP,
  portfolios: PORTFOLIOS_HELP,
  users: USERS_HELP,
  teams: TEAMS_HELP,
  agents: AGENTS_HELP,
  attachments: ATTACHMENTS_HELP,
  search: SEARCH_HELP,
  status: STATUS_HELP,
  setup: SETUP_HELP,
  login: `usage: asana-axi login [--client-id ID] [--client-secret SECRET]
Opens your browser for Asana OAuth authorization.
Requires a pre-registered OAuth app (Asana's MCP does not support dynamic
client registration): create one at https://app.asana.com/0/my-apps with
redirect URI http://localhost:8781/callback, then export
ASANA_AXI_CLIENT_ID and ASANA_AXI_CLIENT_SECRET (or pass --client-id/--client-secret).`,
  logout: `usage: asana-axi logout\nClears stored Asana credentials.`,
  auth: `usage: asana-axi auth status\nReports authentication state.`,
  help: `usage: asana-axi help [command]\nShows top-level or command-specific usage.`,
};

function getCommandHelp(cmd: string): string | undefined {
  return COMMAND_HELP[cmd];
}

function requireArguments(args: string[], expected: string[], usage: string): void {
  if (args.length === expected.length && args.every((arg, index) => arg === expected[index])) return;
  throw usageError('Unexpected arguments', [`Run \`${usage}\``]);
}

export async function main(options: { argv?: string[]; stdout?: NodeJS.WritableStream } = {}): Promise<void> {
  await runAxiCli({
    ...(options.argv ? { argv: options.argv } : {}),
    ...(options.stdout ? { stdout: options.stdout } : {}),
    description: DESCRIPTION,
    version: '0.1.0',
    topLevelHelp: TOP_HELP,
    home: async () => homeCommand(),
    commands: {
      me: async (args: string[]) => {
        requireArguments(args, [], 'asana-axi me');
        return meCommand();
      },
      tasks: (args: string[]) => tasksCommand(args),
      projects: (args: string[]) => projectsCommand(args),
      portfolios: (args: string[]) => portfoliosCommand(args),
      users: (args: string[]) => usersCommand(args),
      teams: async (args: string[]) => {
        requireArguments(args, [], 'asana-axi teams');
        return teamsCommand();
      },
      agents: (args: string[]) => agentsCommand(args),
      attachments: (args: string[]) => attachmentsCommand(args),
      search: (args: string[]) => searchCommand(args),
      status: (args: string[]) => statusCommand(args),
      login: async (args: string[]) => {
        const flags = parseFlags(args, { value: ['client-id', 'client-secret'] });
        requireArguments(flags.positionals, [], 'asana-axi login');
        await runLogin({ clientId: one(flags, 'client-id'), clientSecret: one(flags, 'client-secret') });
        return '';
      },
      logout: async (args: string[]) => {
        requireArguments(args, [], 'asana-axi logout');
        runLogout();
        return '';
      },
      auth: async (args: string[]) => {
        requireArguments(args, ['status'], 'asana-axi auth status');
        return `authenticated: ${authStatus().authenticated}`;
      },
      setup: async (args: string[]) => setupCommand(args),
      help: async (args: string[]) => {
        if (args.length === 0) return TOP_HELP;
        if (args.length === 1 && COMMAND_HELP[args[0]]) return COMMAND_HELP[args[0]]!;
        throw new AxiError('Unknown command', 'VALIDATION_ERROR', ['Run `asana-axi help` to see available commands']);
      },
    },
    getCommandHelp,
  });
}
