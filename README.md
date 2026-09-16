# asana-axi

Agent-ergonomic CLI for [Asana](https://asana.com), built on the
[AXI](https://github.com/kunchenguid/axi) principles: token-efficient
[TOON](https://toonformat.dev) output, minimal schemas, contextual next-step
suggestions, and structured errors.

It wraps Asana's official V2 MCP server as a scriptable, headless CLI so any
agent can drive Asana via plain shell commands - no MCP client required.

## Install

```sh
npm install -g asana-axi
# or run on demand, no install:
npx -y asana-axi <command>
```

## One-time setup: register an OAuth app

Asana's V2 MCP server does **not** support dynamic client registration, so
unlike most OAuth CLIs there's a manual step before `login` works:

1. Create an app at [app.asana.com/0/my-apps](https://app.asana.com/0/my-apps)
   (type: OAuth).
2. Set its redirect URI to `http://localhost:8781/callback`.
3. Export the resulting credentials:

   ```sh
   export ASANA_AXI_CLIENT_ID=...
   export ASANA_AXI_CLIENT_SECRET=...
   ```

   Or pass them per-login: `asana-axi login --client-id ... --client-secret ...`
   (flags win over env vars).

## Authenticate

```sh
asana-axi login
```

Opens your browser for Asana's OAuth flow. Tokens are stored at
`~/.config/asana-axi/credentials.json` and refreshed automatically (access
tokens expire hourly; refresh is handled by the MCP SDK's transport).
`asana-axi logout` clears them; `asana-axi auth status` reports state.

## Commands

```
asana-axi                                   dashboard: whoami + counts + next steps
asana-axi login | logout | auth status
asana-axi me                                get_me
asana-axi tasks [--project X] [--section X] [--tag X] [--assignee X] [--completed]
asana-axi tasks get <gid>
asana-axi tasks mine [--completed]
asana-axi tasks search "<query>" [--assignee X] [--due-date X] [--project X]
asana-axi tasks create "<name>" [--project X] [--assignee X] [--due-date X] [--description X]
asana-axi tasks update <gid> [--name X] [--assignee X] [--completed|--incomplete]
asana-axi tasks delete <gid>
asana-axi tasks comment <gid> "<text>"
asana-axi projects [--team X] [--archived]
asana-axi projects get <gid>
asana-axi projects create "<name>"
asana-axi projects status <gid> "<title>" "<body>" [--color green|yellow|red]
asana-axi portfolios [| get <gid> | items <gid>]
asana-axi users [--team X] | users get <me|gid|email> | users me
asana-axi teams
asana-axi agents [| get <gid>]
asana-axi attachments <gid>
asana-axi search "<query>" [--type task|project|...]
asana-axi status "<keyword>"
asana-axi setup hooks
asana-axi help [command]
```

Run `asana-axi <command> --help` or `asana-axi help <command>` for
command-specific usage. Unknown flags and invalid command arguments return a
validation error (exit code 2). MCP tool errors exit 1.

### Flags

- `--full` - show extra detail fields on list output.
- `--fields a,b,c` - pick exactly which fields a list prints.
- List results default to 3-5 fields and a definitive empty state like
  `0 tasks found`.

### Examples

```sh
asana-axi tasks mine
asana-axi tasks search "launch plan" --assignee me
asana-axi tasks create "Ship it" --project 123456789 --due-date 2026-10-01
asana-axi tasks update 987654321 --completed
asana-axi projects --team 123456789
asana-axi search "Q4 roadmap" --type project
```

Every response ends with a `help:` block of suggested next commands.

## Why not the raw MCP tools

Asana's tool set (`search_objects`, `get_tasks`, `create_tasks`, ...) is
designed for a chat client's tool-call loop, with an "Interactive" preview
variant of writes meant for confirming UI (`create_task_preview`, etc.).
`asana-axi` skips those preview tools - a script doesn't need a confirmation
dialog - and gives every read/write a normal CLI shape with TOON output,
validation errors, and `help:` suggestions instead of raw JSON.

## Development

```sh
npm install
npm test
npm run build
npm run dev -- tasks mine
```

## License

MIT
