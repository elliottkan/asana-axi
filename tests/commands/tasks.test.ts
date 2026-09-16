import { describe, it, expect, vi, beforeEach } from 'vitest';

const callTool = vi.fn();
vi.mock('../../src/mcp/client.js', () => ({ callTool: (...args: unknown[]) => callTool(...args) }));

beforeEach(() => {
  callTool.mockReset();
});

describe('tasksCommand', () => {
  it('renders a definitive empty state with 0 args', async () => {
    callTool.mockResolvedValue({ tasks: [] });
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    const out = await tasksCommand([]);
    expect(out).toContain('0 tasks found');
    expect(callTool).toHaveBeenCalledWith('get_tasks', {});
  });

  it('lists tasks with project filter and pluralized count', async () => {
    callTool.mockResolvedValue({ tasks: [{ gid: '1', name: 'Ship it' }] });
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    const out = await tasksCommand(['--project', '123']);
    expect(out).toContain('1 task found');
    expect(out).toContain('Ship it');
    expect(callTool).toHaveBeenCalledWith('get_tasks', { project: '123' });
  });

  it('tasks get requires a gid', async () => {
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    await expect(tasksCommand(['get'])).rejects.toThrow(/requires a task gid/);
  });

  it('tasks get calls get_task with the gid', async () => {
    callTool.mockResolvedValue({ gid: '42', name: 'Detail' });
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    const out = await tasksCommand(['get', '42']);
    expect(callTool).toHaveBeenCalledWith('get_task', { gid: '42' });
    expect(out).toContain('Detail');
  });

  it('tasks mine passes is_completed only when --completed is set', async () => {
    callTool.mockResolvedValue({ tasks: [] });
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    await tasksCommand(['mine']);
    expect(callTool).toHaveBeenCalledWith('get_my_tasks', {});
    await tasksCommand(['mine', '--completed']);
    expect(callTool).toHaveBeenCalledWith('get_my_tasks', { is_completed: true });
  });

  it('tasks create requires a name', async () => {
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    await expect(tasksCommand(['create'])).rejects.toThrow(/requires a name/);
  });

  it('tasks create sends a single-item tasks array', async () => {
    callTool.mockResolvedValue({ tasks: [{ gid: '9', name: 'New task' }] });
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    await tasksCommand(['create', 'New task', '--project', '1', '--due-date', '2026-01-01']);
    expect(callTool).toHaveBeenCalledWith('create_tasks', {
      tasks: [{ name: 'New task', project: '1', due_date: '2026-01-01' }],
    });
  });

  it('tasks update rejects --completed and --incomplete together', async () => {
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    await expect(tasksCommand(['update', '1', '--completed', '--incomplete'])).rejects.toThrow(/mutually exclusive/);
  });

  it('tasks update sends is_completed true for --completed', async () => {
    callTool.mockResolvedValue({ tasks: [{ gid: '1', name: 'x', completed: true }] });
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    await tasksCommand(['update', '1', '--completed']);
    expect(callTool).toHaveBeenCalledWith('update_tasks', { tasks: [{ gid: '1', is_completed: true }] });
  });

  it('tasks delete calls delete_task', async () => {
    callTool.mockResolvedValue({});
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    const out = await tasksCommand(['delete', '5']);
    expect(callTool).toHaveBeenCalledWith('delete_task', { gid: '5' });
    expect(out).toContain('deleted');
  });

  it('tasks comment requires gid and text', async () => {
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    await expect(tasksCommand(['comment', '5'])).rejects.toThrow(/requires a task gid and text/);
  });

  it('tasks comment calls add_comment', async () => {
    callTool.mockResolvedValue({});
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    const out = await tasksCommand(['comment', '5', 'looks', 'good']);
    expect(callTool).toHaveBeenCalledWith('add_comment', { gid: '5', text: 'looks good' });
    expect(out).toContain('comment added');
  });

  it('rejects an unknown subcommand', async () => {
    const { tasksCommand } = await import('../../src/commands/tasks.js');
    await expect(tasksCommand(['bogus'])).rejects.toThrow(/Unknown tasks subcommand/);
  });
});
