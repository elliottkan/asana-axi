import { AxiError, exitCodeForError } from 'axi-sdk-js';
export { AxiError, exitCodeForError };

/**
 * Usage errors - a bad flag, a missing argument, an unknown subcommand - must
 * exit 2, which the SDK keys off the `VALIDATION_ERROR` code. Everything else
 * (auth failures, a rejected MCP tool call) exits 1.
 */
export function usageError(message: string, suggestions: string[] = []): AxiError {
  return new AxiError(message, 'VALIDATION_ERROR', suggestions);
}

export function mapMcpError(error: unknown): AxiError {
  const msg = error instanceof Error ? error.message : String(error);
  if (/unauthor/i.test(msg) || /\b401\b/.test(msg)) {
    return new AxiError('Not authenticated with Asana', 'AUTH_REQUIRED', ['Run `asana-axi login`']);
  }
  return new AxiError(msg || 'Asana MCP request failed', 'MCP_ERROR');
}
