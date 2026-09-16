import { describe, it, expect } from 'vitest';
import { parseFlags, one, positiveInt } from '../src/flags.js';

describe('parseFlags', () => {
  it('collects positionals and value flags', () => {
    const parsed = parseFlags(['Ship it', '--project', '123'], { value: ['project'] });
    expect(parsed.positionals).toEqual(['Ship it']);
    expect(one(parsed, 'project')).toBe('123');
  });

  it('supports --flag=value', () => {
    const parsed = parseFlags(['--project=123'], { value: ['project'] });
    expect(one(parsed, 'project')).toBe('123');
  });

  it('sets boolean flags', () => {
    const parsed = parseFlags(['--completed'], { boolean: ['completed'] });
    expect(parsed.booleans.has('completed')).toBe(true);
  });

  it('rejects a value on a boolean flag', () => {
    expect(() => parseFlags(['--completed=true'], { boolean: ['completed'] })).toThrow(/does not take a value/);
  });

  it('rejects an unknown flag', () => {
    expect(() => parseFlags(['--bogus'], {})).toThrow(/Unknown flag/);
  });

  it('rejects a value flag with nothing after it', () => {
    expect(() => parseFlags(['--project'], { value: ['project'] })).toThrow(/requires a value/);
  });

  it('treats "--" as end-of-flags', () => {
    const parsed = parseFlags(['--', '--not-a-flag'], {});
    expect(parsed.positionals).toEqual(['--not-a-flag']);
  });

  it('resolves aliases', () => {
    const parsed = parseFlags(['-n', '5'], { value: ['limit'], alias: { n: 'limit' } });
    expect(positiveInt(parsed, 'limit')).toBe(5);
  });

  it('positiveInt rejects non-integers', () => {
    const parsed = parseFlags(['--limit', 'abc'], { value: ['limit'] });
    expect(() => positiveInt(parsed, 'limit')).toThrow(/positive integer/);
  });
});
