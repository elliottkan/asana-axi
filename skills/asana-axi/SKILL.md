---
name: asana-axi
description: 'Drive Asana from the shell via the asana-axi CLI - read and write tasks, projects, portfolios, users, teams, and status updates. Use when the user wants to check, create, or update anything in Asana.'
user-invocable: false
author: Elliott Kan
metadata:
  hermes:
    tags: [asana, project-management, tasks, axi]
    category: productivity
---

# asana-axi

Agent-ergonomic Asana CLI. Prefer this over the raw Asana MCP tools.

Invoke with `npx -y asana-axi <command>`. If output shows a follow-up
`asana-axi ...` command, run it as `npx -y asana-axi ...`.

Auth is one-time but requires a manual step: Asana's MCP server has no
dynamic client registration, so a user must create an OAuth app at
https://app.asana.com/0/my-apps, set its redirect URI to
`http://localhost:8781/callback`, and export `ASANA_AXI_CLIENT_ID` /
`ASANA_AXI_CLIENT_SECRET` before `npx -y asana-axi login` will work. If a
command reports "not authenticated" or "Missing Asana OAuth app credentials",
tell the user to do this rather than retrying.

## Commands

- `me` - the authenticated user (`get_me`)
- `tasks [--project X] [--section X] [--tag X] [--assignee X] [--completed]` - list tasks
- `tasks get <gid>` - full task detail
- `tasks mine [--completed]` - tasks assigned to the authenticated user
- `tasks search "<query>" [--assignee X] [--due-date X] [--project X]` - Premium-only task search
- `tasks create "<name>" [--project X] [--assignee X] [--due-date X] [--description X]`
- `tasks update <gid> [--name X] [--assignee X] [--completed|--incomplete]`
- `tasks delete <gid>`
- `tasks comment <gid> "<text>"`
- `projects [--team X] [--archived]` / `projects get <gid>` / `projects create "<name>"`
- `projects status <gid> "<title>" "<body>" [--color green|yellow|red]`
- `portfolios` / `portfolios get <gid>` / `portfolios items <gid>`
- `users [--team X]` / `users get <me|gid|email>` / `users me`
- `teams` - list teams
- `agents` / `agents get <gid>` - workspace AI agents
- `attachments <gid>` - attachments on a task
- `search "<query>" [--type task|project|portfolio|tag|user]` - global search
- `status "<keyword>"` - search project status updates
- `login` / `logout` / `auth status`
- `setup hooks` - install SessionStart ambient-context hooks
- `help [command]`

Run `<command> --help` or `help <command>` for command-specific usage.
Unknown flags and invalid arguments return a validation error (exit 2); MCP
tool errors exit 1.

## Workflow

1. `npx -y asana-axi` - dashboard: whoami, open task count, next-step hints.
2. `tasks mine`, `projects`, or `search "<query>"` to find things.
3. `tasks create`, `tasks update`, `projects status`, etc. to write. Writes
   apply immediately - there is no confirmation step (the "preview" MCP
   tools are chat-UI-only and this CLI skips them).
4. Every response ends with `help:` next-step hints - follow them.

## Tips

- Output is TOON-encoded and token-efficient; list results show 3-5 fields
  plus a count. Use `--full` for more detail or `--fields a,b,c` to pick
  exactly which fields print.
- `tasks update` and `tasks create` take a single task at a time from this
  CLI even though the underlying tools accept up to 50 - script a loop for
  bulk operations.
