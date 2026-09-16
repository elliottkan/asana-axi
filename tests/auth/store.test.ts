import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'asana-axi-'));
  process.env.ASANA_AXI_CONFIG_DIR = dir;
});

describe('credential store', () => {
  it('round-trips tokens and writes a 0600 file', async () => {
    const { saveCredentials, loadCredentials } = await import('../../src/auth/store.js?u=' + Date.now());
    saveCredentials({ tokens: { access_token: 'a', token_type: 'Bearer' } as any });
    expect(loadCredentials()?.tokens?.access_token).toBe('a');
    const mode = statSync(join(dir, 'credentials.json')).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('clear removes the file', async () => {
    const { saveCredentials, clearCredentials } = await import('../../src/auth/store.js?u=' + Date.now());
    saveCredentials({ tokens: { access_token: 'a', token_type: 'Bearer' } as any });
    clearCredentials();
    expect(existsSync(join(dir, 'credentials.json'))).toBe(false);
  });

  it('loadCredentials returns undefined when nothing is stored', async () => {
    const { loadCredentials } = await import('../../src/auth/store.js?u=' + Date.now());
    expect(loadCredentials()).toBeUndefined();
  });

  it('loadCredentials returns undefined on corrupt JSON', async () => {
    const { writeFileSync, mkdirSync } = await import('node:fs');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'credentials.json'), 'not json');
    const { loadCredentials } = await import('../../src/auth/store.js?u=' + Date.now());
    expect(loadCredentials()).toBeUndefined();
  });
});
