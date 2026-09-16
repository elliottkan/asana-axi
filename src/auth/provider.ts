import { randomUUID } from 'node:crypto';
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type {
  OAuthClientMetadata,
  OAuthClientInformationMixed,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import { AxiError } from '../errors.js';
import { loadCredentials, saveCredentials } from './store.js';

export const REDIRECT_PORT = 8781;
export const REDIRECT_URL = `http://localhost:${REDIRECT_PORT}/callback`;

export interface StaticClientCredentials {
  clientId: string;
  clientSecret: string;
}

export interface ClientCredentialFlags {
  clientId?: string;
  clientSecret?: string;
}

/**
 * Asana's V2 MCP server does not support dynamic client registration -
 * clients must pre-register at https://app.asana.com/0/my-apps and pass the
 * resulting client id/secret in themselves. Flags win over env vars.
 */
export function resolveClientCredentials(flags: ClientCredentialFlags = {}): StaticClientCredentials {
  const clientId = flags.clientId ?? process.env.ASANA_AXI_CLIENT_ID;
  const clientSecret = flags.clientSecret ?? process.env.ASANA_AXI_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new AxiError('Missing Asana OAuth app credentials', 'AUTH_REQUIRED', [
      'Create an OAuth app at https://app.asana.com/0/my-apps',
      `Set its redirect URI to ${REDIRECT_URL}`,
      'Export ASANA_AXI_CLIENT_ID and ASANA_AXI_CLIENT_SECRET (or pass --client-id/--client-secret to `asana-axi login`)',
    ]);
  }
  return { clientId, clientSecret };
}

export class AsanaOAuthProvider implements OAuthClientProvider {
  lastState?: string;
  private verifier?: string;
  private readonly clientInfo: OAuthClientInformationMixed;

  constructor(
    private readonly onRedirect: (url: URL) => void,
    credentials: StaticClientCredentials,
  ) {
    this.clientInfo = {
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uris: [REDIRECT_URL],
    };
  }

  readonly redirectUrl = REDIRECT_URL;
  readonly clientMetadata: OAuthClientMetadata = {
    client_name: 'asana-axi',
    redirect_uris: [REDIRECT_URL],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
  };

  clientInformation(): OAuthClientInformationMixed | undefined {
    // Static, pre-registered app - there is no dynamic registration to persist.
    return this.clientInfo;
  }

  saveClientInformation(_info: OAuthClientInformationMixed): void {
    // No-op: Asana's V2 MCP server has no dynamic client registration to save.
  }

  tokens(): OAuthTokens | undefined {
    return loadCredentials()?.tokens;
  }

  saveTokens(tokens: OAuthTokens): void {
    const creds = loadCredentials() ?? {};
    creds.tokens = tokens;
    saveCredentials(creds);
  }

  state(): string {
    this.lastState = randomUUID();
    return this.lastState;
  }

  redirectToAuthorization(url: URL): void {
    this.onRedirect(url);
  }

  saveCodeVerifier(v: string): void {
    this.verifier = v;
  }

  codeVerifier(): string {
    if (!this.verifier) throw new Error('no code verifier');
    return this.verifier;
  }

  async invalidateCredentials(scope: 'all' | 'client' | 'tokens' | 'verifier' | 'discovery'): Promise<void> {
    if (scope === 'all' || scope === 'tokens') {
      const creds = loadCredentials() ?? {};
      delete creds.tokens;
      saveCredentials(creds);
    }
    if (scope === 'all' || scope === 'verifier') {
      this.verifier = undefined;
    }
  }
}
