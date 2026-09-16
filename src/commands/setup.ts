import { installSessionStartHooks } from 'axi-sdk-js';
import { usageError } from '../errors.js';
import { renderHelp, renderOutput } from '../format/toon.js';

export const SETUP_HELP = `usage: asana-axi setup hooks
Install or repair agent SessionStart hooks for asana-axi ambient context.

examples:
  asana-axi setup hooks`;

export async function setupCommand(args: string[]): Promise<string> {
  if (args.length !== 1 || args[0] !== 'hooks') {
    throw usageError('Unknown setup action', ['Run `asana-axi setup hooks`']);
  }
  installSessionStartHooks({ marker: 'asana-axi', binaryNames: ['asana-axi'] });
  return renderOutput([
    'hooks:\n  status: installed\n  integrations: Claude Code, Codex, OpenCode',
    renderHelp(['Restart your agent session to receive asana-axi ambient context']),
  ]);
}
