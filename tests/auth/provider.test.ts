import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

beforeEach(() => {
  process.env.ASANA_AXI_CONFIG_DIR = mkdtempSync(join(tmpdir(), 'asana-axi-'));
  delete process.env.ASANA_AXI_CLIENT_ID;
  delete process.env.ASANA_AXI_CLIENT_SECRET;
});

const creds = { clientId: 'client-123', clientSecret: 'secret-456' };

describe('AsanaOAuthProvider', () => {
  it('round-trips code verifier in memory on the same instance', async () => {
    const { AsanaOAuthProvider } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new AsanaOAuthProvider(() => {}, creds);
    p.saveCodeVerifier('v123');
    expect(p.codeVerifier()).toBe('v123');
  });

  it('persists tokens through the store across instances', async () => {
    const { AsanaOAuthProvider } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new AsanaOAuthProvider(() => {}, creds);
    p.saveTokens({ access_token: 'tok', token_type: 'Bearer' } as any);
    const p2 = new AsanaOAuthProvider(() => {}, creds);
    expect(p2.tokens()?.access_token).toBe('tok');
  });

  it('produces a random state and exposes it as lastState', async () => {
    const { AsanaOAuthProvider } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new AsanaOAuthProvider(() => {}, creds);
    const s = p.state();
    expect(s).toEqual(p.lastState);
    expect(s.length).toBeGreaterThan(10);
  });

  it('clientInformation returns the static client info built from credentials', async () => {
    const { AsanaOAuthProvider, REDIRECT_URL } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new AsanaOAuthProvider(() => {}, creds);
    expect(p.clientInformation()).toEqual({
      client_id: 'client-123',
      client_secret: 'secret-456',
      redirect_uris: [REDIRECT_URL],
    });
  });

  it('saveClientInformation is a no-op (no dynamic registration to persist)', async () => {
    const { AsanaOAuthProvider } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new AsanaOAuthProvider(() => {}, creds);
    const before = p.clientInformation();
    p.saveClientInformation({ client_id: 'other', redirect_uris: [] } as any);
    expect(p.clientInformation()).toEqual(before);
  });

  it('codeVerifier throws on new instance that never saved one', async () => {
    const { AsanaOAuthProvider } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new AsanaOAuthProvider(() => {}, creds);
    expect(() => p.codeVerifier()).toThrow('no code verifier');
  });

  it('exposes redirectUrl and clientMetadata', async () => {
    const { AsanaOAuthProvider, REDIRECT_URL } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new AsanaOAuthProvider(() => {}, creds);
    expect(p.redirectUrl).toBe(REDIRECT_URL);
    expect(p.clientMetadata.client_name).toBe('asana-axi');
    expect(p.clientMetadata.grant_types).toContain('authorization_code');
  });

  it('invalidateCredentials("tokens") clears persisted tokens', async () => {
    const { AsanaOAuthProvider } = await import('../../src/auth/provider.js?u=' + Date.now());
    const p = new AsanaOAuthProvider(() => {}, creds);
    p.saveTokens({ access_token: 'tok', token_type: 'Bearer' } as any);
    expect(p.tokens()?.access_token).toBe('tok');
    await p.invalidateCredentials('tokens');
    expect(p.tokens()).toBeUndefined();
  });

  it('calls onRedirect when redirectToAuthorization is invoked', async () => {
    const { AsanaOAuthProvider } = await import('../../src/auth/provider.js?u=' + Date.now());
    let redirectedTo: URL | undefined;
    const p = new AsanaOAuthProvider((url) => {
      redirectedTo = url;
    }, creds);
    const testUrl = new URL('https://app.asana.com/-/oauth_authorize?foo=bar');
    p.redirectToAuthorization(testUrl);
    expect(redirectedTo?.href).toBe(testUrl.href);
  });
});

describe('resolveClientCredentials', () => {
  it('reads from env vars', async () => {
    process.env.ASANA_AXI_CLIENT_ID = 'env-id';
    process.env.ASANA_AXI_CLIENT_SECRET = 'env-secret';
    const { resolveClientCredentials } = await import('../../src/auth/provider.js?u=' + Date.now());
    expect(resolveClientCredentials()).toEqual({ clientId: 'env-id', clientSecret: 'env-secret' });
  });

  it('flags win over env vars', async () => {
    process.env.ASANA_AXI_CLIENT_ID = 'env-id';
    process.env.ASANA_AXI_CLIENT_SECRET = 'env-secret';
    const { resolveClientCredentials } = await import('../../src/auth/provider.js?u=' + Date.now());
    expect(resolveClientCredentials({ clientId: 'flag-id', clientSecret: 'flag-secret' })).toEqual({
      clientId: 'flag-id',
      clientSecret: 'flag-secret',
    });
  });

  it('throws a clear AxiError with the my-apps URL when credentials are missing', async () => {
    const { resolveClientCredentials } = await import('../../src/auth/provider.js?u=' + Date.now());
    try {
      resolveClientCredentials();
      throw new Error('expected to throw');
    } catch (e: any) {
      expect(e.code).toBe('AUTH_REQUIRED');
      expect(e.suggestions.join(' ')).toContain('https://app.asana.com/0/my-apps');
    }
  });
});
