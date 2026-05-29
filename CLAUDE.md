# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**SVN Desktop** is a Windows desktop application built with Electron that provides a GitHub Desktop-style GUI for SVN repositories. Key features:
- Save and manage multiple SVN working copy paths
- Browse and stage changed files per repository
- Commit changes with message input
- View commit history (log)
- View unified diffs (before/after)

## Technology Stack

- **Shell**: Electron 33 (main process)
- **UI**: React 18 + TypeScript (renderer process)
- **State**: Redux Toolkit (Zustand-style slices)
- **Build**: electron-vite (Vite-based)
- **SVN**: SVN CLI (`svn.exe`) via `child_process` — no native bindings

## Build & Run

```powershell
# Install dependencies (first time)
npm install

# Dev mode (hot reload)
npm run dev

# Build production
npm run build

# Package as .exe installer
npm run package
```

## Project Structure

```
svnManager/
├── electron.vite.config.ts   # Build config for main/preload/renderer
├── package.json
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── src/
│   ├── main/                 # Electron main process (Node.js)
│   │   ├── index.ts          # BrowserWindow creation, app lifecycle
│   │   ├── ipc.ts            # ipcMain.handle registrations
│   │   └── svn/
│   │       ├── SvnClient.ts  # All svn.exe calls + XML/diff parsers
│   │       └── RepositoryStore.ts  # JSON persistence in %APPDATA%
│   ├── preload/
│   │   └── index.ts          # contextBridge → exposes window.api
│   ├── renderer/
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx      # React entry + Redux Provider
│   │       ├── App.tsx       # Tab bar + layout shell
│   │       ├── env.d.ts      # window.api type augmentation
│   │       ├── store/        # Redux slices
│   │       │   ├── index.ts
│   │       │   ├── repositoriesSlice.ts
│   │       │   ├── changesSlice.ts
│   │       │   └── historySlice.ts
│   │       ├── components/
│   │       │   ├── Sidebar/   # Repository list + add/remove
│   │       │   ├── Changes/   # File list + commit panel + diff
│   │       │   ├── History/   # SVN log + revision detail
│   │       │   └── Diff/      # Unified diff renderer
│   │       └── styles/
│   │           └── global.css
│   └── shared/
│       └── types.ts          # Shared interfaces + IPC channel names
└── resources/
    └── icon.ico              # App icon (add before packaging)
```

## Key Architecture Decisions

### IPC Flow
```
Renderer (React) → window.api.svn.* → preload contextBridge → ipcRenderer.invoke
→ ipcMain.handle → SvnClient.ts (child_process svn.exe) → result back up
```

### SVN Integration
`SvnClient.ts` spawns `svn` subprocesses with `--xml` flag where available. All methods are `async`. Parsers use regex against the XML stdout — no XML library dependency.

### Repository Persistence
Saved paths are stored as JSON at `%APPDATA%\SVN Desktop\repositories.json` via `RepositoryStore.ts`. Loaded on startup via `repos:list` IPC.

### Shared Types
`src/shared/types.ts` is imported by both main and renderer — the IPC channel constants (`IPC.*`) live there to avoid string duplication.

## UI Design Reference

**All UI behavior and visual design is based on GitHub Desktop release-3.5.11.**
Reference repository: https://github.com/desktop/desktop/tree/release-3.5.11

- Layout, spacing, colors, typography → match GitHub Desktop exactly
- Interaction patterns (dropdown behavior, overlays, hover states) → match GitHub Desktop exactly
- When a dropdown/panel opens, the rest of the screen gets a dark semi-transparent overlay (faded backdrop), same as GitHub Desktop
- Dropdown menus are positioned `top: 100%` relative to their trigger button's parent section

## Prerequisites

- Node.js 20+
- SVN command-line tools installed and on `PATH` (`svn --version` should work)
