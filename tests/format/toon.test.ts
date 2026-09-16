import { describe, it, expect } from 'vitest';
import { field, pluck, custom, renderList, renderDetail, renderHelp, renderError, renderOutput } from '../../src/format/toon.js';

describe('toon formatting', () => {
  it('renderList extracts field()s with null fallback', () => {
    const out = renderList('tasks', [{ gid: '1', name: 'Ship it' }], [field('gid'), field('name'), field('missing')]);
    expect(out).toContain('tasks');
    expect(out).toContain('Ship it');
  });

  it('pluck() reads a nested subkey', () => {
    const out = renderDetail('task', { assignee: { name: 'Ada' } }, [pluck('assignee', 'name', 'assignee_name')]);
    expect(out).toContain('Ada');
  });

  it('custom() computes a derived field', () => {
    const out = renderDetail('task', { completed: true }, [custom('state', (i) => (i.completed ? 'done' : 'open'))]);
    expect(out).toContain('done');
  });

  it('renderHelp returns empty string for no lines', () => {
    expect(renderHelp([])).toBe('');
  });

  it('renderHelp numbers the block', () => {
    expect(renderHelp(['a', 'b'])).toContain('help[2]:');
  });

  it('renderError includes suggestions when present', () => {
    const out = renderError('boom', 'MCP_ERROR', ['try again']);
    expect(out).toContain('boom');
    expect(out).toContain('try again');
  });

  it('renderOutput filters falsy blocks and joins with newline', () => {
    expect(renderOutput(['a', '', 'b'])).toBe('a\nb');
  });
});
