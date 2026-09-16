import { createServer, type Server } from 'node:http';
import open from 'open';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { MCP_URL } from '../config.js';
import { AsanaOAuthProvider, REDIRECT_PORT, resolveClientCredentials, type ClientCredentialFlags } from './provider.js';
import { loadCredentials, clearCredentials } from './store.js';

export function parseCallback(callbackUrl: string, expectedState: string): URLSearchParams {
  const params = new URL(callbackUrl).searchParams;
  if (params.get('state') !== expectedState) throw new Error('state mismatch');
  return params;
}

function waitForCallback(provider: AsanaOAuthProvider, serverRef: { current: Server | null }): Promise<URLSearchParams> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (!req.url?.startsWith('/callback')) {
        res.writeHead(404).end();
        return;
      }
      try {
        const params = parseCallback(`http://localhost:${REDIRECT_PORT}${req.url}`, provider.lastState ?? '');
        res.writeHead(200, { 'content-type': 'text/html' }).end('<p>asana-axi: you can close this tab.</p>');
        server.close();
        resolve(params);
      } catch (e) {
        res.writeHead(400).end('state mismatch');
        server.close();
        reject(e);
      }
    });
    serverRef.current = server;
    server.listen(REDIRECT_PORT);
    server.on('error', reject);
  });
}

export async function runLogin(flags: ClientCredentialFlags = {}): Promise<void> {
  const credentials = resolveClientCredentials(flags);
  const provider = new AsanaOAuthProvider((url) => {
    void (async () => {
      try {
        await open(url.toString());
        process.stderr.write('Opening your browser to authorize asana-axi…\n');
      } catch {
        process.stderr.write(`Open this URL in your browser to authorize asana-axi:\n${url}\n`);
      }
    })();
  }, credentials);
  const client = new Client({ name: 'asana-axi', version: '0.1.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider }));
    process.stdout.write('Already authenticated.\n');
    return;
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) throw error;
  }
  const serverRef: { current: Server | null } = { current: null };
  const params = await Promise.race([
    waitForCallback(provider, serverRef),
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        serverRef.current?.close();
        reject(new Error('Login timed out after 2 minutes — run `asana-axi login` again'));
      }, 120_000).unref(),
    ),
  ]);
  const authTransport = new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider });
  const code = params.get('code');
  if (!code) throw new Error('authorization code missing from callback');
  await authTransport.finishAuth(code);
  await new Client({ name: 'asana-axi', version: '0.1.0' }).connect(
    new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider }),
  );
  process.stdout.write('Login successful.\n');
}

export function runLogout(): void {
  clearCredentials();
  process.stdout.write('Logged out.\n');
}

export function authStatus(): { authenticated: boolean } {
  return { authenticated: Boolean(loadCredentials()?.tokens?.access_token) };
}
