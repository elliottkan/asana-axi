import { describe, it, expect, vi, beforeEach } from 'vitest';

const callTool = vi.fn();
vi.mock('../../src/mcp/client.js', () => ({ callTool: (...args: unknown[]) => callTool(...args) }));

beforeEach(() => {
  callTool.mockReset();
});

describe('searchCommand', () => {
  it('requires a query', async () => {
    const { searchCommand } = await import('../../src/commands/search.js');
    await expect(searchCommand([])).rejects.toThrow(/requires a query/);
  });

  it('passes --type through to search_objects', async () => {
    callTool.mockResolvedValue({ results: [{ gid: '1', name: 'x', resource_type: 'task' }] });
    const { searchCommand } = await import('../../src/commands/search.js');
    const out = await searchCommand(['launch', 'plan', '--type', 'task']);
    expect(callTool).toHaveBeenCalledWith('search_objects', { query: 'launch plan', type: 'task' });
    expect(out).toContain('1 result found');
  });

  it('0 results found is definitive', async () => {
    callTool.mockResolvedValue({ results: [] });
    const { searchCommand } = await import('../../src/commands/search.js');
    const out = await searchCommand(['nothing']);
    expect(out).toContain('0 results found');
  });
});
