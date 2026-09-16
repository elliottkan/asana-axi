import { describe, it, expect, vi, beforeEach } from 'vitest';

const callTool = vi.fn();
vi.mock('../../src/mcp/client.js', () => ({ callTool: (...args: unknown[]) => callTool(...args) }));

beforeEach(() => {
  callTool.mockReset();
});

describe('projectsCommand', () => {
  it('0 projects found is definitive', async () => {
    callTool.mockResolvedValue({ projects: [] });
    const { projectsCommand } = await import('../../src/commands/projects.js');
    const out = await projectsCommand([]);
    expect(out).toContain('0 projects found');
  });

  it('projects status validates color', async () => {
    const { projectsCommand } = await import('../../src/commands/projects.js');
    await expect(projectsCommand(['status', '1', 'Title', 'Body', '--color', 'purple'])).rejects.toThrow(/--color must be one of/);
  });

  it('projects status calls create_project_status_update', async () => {
    callTool.mockResolvedValue({ gid: '1', title: 'On track', status_color: 'green' });
    const { projectsCommand } = await import('../../src/commands/projects.js');
    await projectsCommand(['status', '1', 'On track', 'Shipping Friday', '--color', 'green']);
    expect(callTool).toHaveBeenCalledWith('create_project_status_update', {
      gid: '1',
      title: 'On track',
      body_text: 'Shipping Friday',
      status_color: 'green',
    });
  });

  it('projects create requires a name', async () => {
    const { projectsCommand } = await import('../../src/commands/projects.js');
    await expect(projectsCommand(['create'])).rejects.toThrow(/requires a name/);
  });
});
