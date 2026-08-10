# E.D.I.T.H.

A desktop GUI that acts as an **agent harness** for [Claude Code CLI](https://claude.ai/code). Instead of managing multiple terminal windows, E.D.I.T.H. wraps Claude Code in a clean interface with session management, worktree support, and isolated per-profile accounts.

![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)

## What it does

- **Work / Personal profiles** — two fully isolated Claude accounts, each with separate credentials, MCP servers, agents, and skills
- **Session management** — create, switch, and delete sessions; each session is a persistent terminal running Claude Code
- **Worktree support** — attach sessions to specific git worktrees
- **Embedded terminal** — full xterm.js terminal per session, auto-launches `claude` on open
- **Dark UI** — blue/amber/emerald accent scheme

## How it works

E.D.I.T.H. spawns a PTY (pseudoterminal) per session using `node-pty` and renders it via `xterm.js`. Each profile gets its own `CLAUDE_CONFIG_DIR` so accounts, MCPs, and skills are completely isolated between work and personal.

```
Renderer (React + xterm.js)
    ↕ contextBridge (IPC)
Main process (Electron)
    ↕ node-pty
Claude Code CLI (claude)
```

Session and worktree metadata is persisted as JSON in the Electron app's `userData` directory — no database.

## Stack

| Layer | Tech |
|---|---|
| App framework | Electron 31 + electron-vite |
| UI | React 18 + TypeScript + Tailwind CSS |
| Terminal | xterm.js v5 |
| PTY | node-pty |
| Build | electron-builder |

## Requirements

- [Claude Code CLI](https://claude.ai/code) installed and accessible as `claude` in PATH
- **Windows**: [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with C++ workload (required to compile `node-pty`)
- Node.js 20+

## Getting started

```bash
# Install dependencies (node-pty needs to compile native binaries)
npm install

# Dev mode
npm run dev

# Build distributable
npm run dist
```

> **Windows note**: If `npm install` fails building `node-pty`, install VS Build Tools first:
> ```
> winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
> ```
> Then re-run `npm install`.

## First run

1. The app asks whether to open a **Work** or **Personal** profile
2. A terminal opens and launches `claude`
3. Claude Code CLI will prompt you to authenticate — log in with the account for that profile
4. From that point on, each profile keeps its own credentials and configuration

Profile data is stored at:
- `%APPDATA%\edith\claude-personal\` (Windows)
- `~/Library/Application Support/edith/claude-personal/` (macOS)

## Project structure

```
src/
├── main/           # Electron main process
│   ├── index.ts    # BrowserWindow setup
│   ├── ipc.ts      # IPC handlers
│   ├── terminal.ts # node-pty management
│   └── store.ts    # JSON persistence
├── preload/
│   └── index.ts    # contextBridge API (window.edith.*)
├── renderer/
│   └── src/
│       ├── App.tsx
│       └── components/
│           ├── Startup/   # Profile selector screen
│           ├── Sidebar/   # Sessions + worktrees list
│           └── Terminal/  # xterm.js terminal pane
└── shared/
    └── types.ts    # Shared TypeScript types
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| F12 | Toggle DevTools (detached window) |

## License

MIT
