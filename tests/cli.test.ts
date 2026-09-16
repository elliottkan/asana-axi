import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('../src/mcp/client.js', () => ({ callTool: vi.fn().mockResolvedValue({}) }));

beforeEach(() => {
  vi.resetModules();
  process.env.ASANA_AXI_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'asana-axi-cli-'));
  process.exitCode = undefined;
});

describe('cli', () => {
  it('auth status reports not authenticated when no creds', { timeout: 15000 }, async () => {
    const chunks: string[] = [];
    const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
    const { main } = await import('../src/cli.js');
    await main({ argv: ['auth', 'status'], stdout });
    expect(chunks.join('')).toMatch(/authenticated: false/i);
  });

  describe('--help on subcommands', () => {
    it('logout --help shows help text and does NOT clear credentials', { timeout: 15000 }, async () => {
      const credPath = join(process.env.ASANA_AXI_CONFIG_DIR!, 'credentials.json');
      mkdirSync(process.env.ASANA_AXI_CONFIG_DIR!, { recursive: true });
      writeFileSync(credPath, JSON.stringify({ tokens: { access_token: 'test-dummy' } }), { mode: 0o600 });

      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['logout', '--help'], stdout });

      const output = chunks.join('');
      expect(output).toMatch(/logout/i);
      expect(output).not.toMatch(/Logged out/i);
      expect(existsSync(credPath)).toBe(true);
      expect(readFileSync(credPath, 'utf-8')).toContain('access_token');
    });

    it('tasks --help shows help text and does not invoke the MCP client', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['tasks', '--help'], stdout });

      const output = chunks.join('');
      expect(output).toMatch(/tasks/i);
      expect(output).not.toMatch(/AUTH_REQUIRED/i);
    });

    it('login --help shows help text and does not open a browser', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['login', '--help'], stdout });

      const output = chunks.join('');
      expect(output).toMatch(/login/i);
      expect(output).toMatch(/my-apps/i);
    });
  });

  describe('help command', () => {
    it('--help documents the help command', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['--help'], stdout });
      expect(chunks.join('')).toMatch(/help \[command\]/i);
    });

    it('help (no args) shows top-level usage', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['help'], stdout });
      expect(chunks.join('')).toMatch(/usage/i);
    });

    it('help tasks shows tasks help', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['help', 'tasks'], stdout });
      const output = chunks.join('');
      expect(output).toMatch(/tasks/i);
      expect(output).toMatch(/usage/i);
    });
  });

  describe('argument validation', () => {
    it('rejects unknown logout flags before clearing credentials', { timeout: 15000 }, async () => {
      const credPath = join(process.env.ASANA_AXI_CONFIG_DIR!, 'credentials.json');
      mkdirSync(process.env.ASANA_AXI_CONFIG_DIR!, { recursive: true });
      writeFileSync(credPath, JSON.stringify({ tokens: { access_token: 'test-dummy' } }), { mode: 0o600 });

      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['logout', '--typo'], stdout });

      expect(chunks.join('')).toMatch(/VALIDATION_ERROR/i);
      expect(process.exitCode).toBe(2);
      expect(readFileSync(credPath, 'utf-8')).toContain('access_token');
    });

    it.each([
      ['login', '--typo'],
      ['auth', 'status', '--typo'],
      ['help', '--typo'],
    ])('rejects invalid arguments for %s', { timeout: 15000 }, async (...argv: string[]) => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv, stdout });
      expect(chunks.join('')).toMatch(/VALIDATION_ERROR/i);
      expect(process.exitCode).toBe(2);
    });

    it('exits 2 on an unknown top-level command', { timeout: 15000 }, async () => {
      const chunks: string[] = [];
      const stdout = { write: (s: string) => (chunks.push(s), true) } as any;
      const { main } = await import('../src/cli.js');
      await main({ argv: ['bogus'], stdout });
      expect(process.exitCode).toBe(2);
    });
  });
});
