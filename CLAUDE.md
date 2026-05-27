# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**svnManager** is a Windows desktop application (`.exe`) that provides a GitHub Desktop-style GUI for SVN repositories. Key features:
- Save and manage multiple SVN repository paths
- Browse working copies per saved path
- Commit changes with message input
- View commit logs
- View file diffs (before/after)

## Technology Stack

- **Language**: C# (.NET 8+)
- **UI Framework**: WPF (Windows Presentation Foundation) — chosen for modern Windows UI, MVVM support, and rich data binding
- **SVN Integration**: `SharpSvn` NuGet package (managed SVN bindings for .NET) or `SVN CLI` process invocation as fallback
- **Architecture Pattern**: MVVM (Model-View-ViewModel)

## Build & Run

```powershell
# Restore dependencies
dotnet restore

# Build
dotnet build

# Run
dotnet run --project src/svnManager/svnManager.csproj

# Build release exe
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

## Project Structure

```
svnManager/
├── src/
│   └── svnManager/
│       ├── svnManager.csproj
│       ├── App.xaml / App.xaml.cs          # Application entry point
│       ├── Models/
│       │   ├── Repository.cs               # Saved SVN path model
│       │   ├── SvnFileStatus.cs            # File status (modified/added/deleted)
│       │   └── SvnLogEntry.cs              # Log entry model
│       ├── ViewModels/
│       │   ├── MainViewModel.cs            # Shell/navigation VM
│       │   ├── RepositoryListViewModel.cs  # Sidebar: saved repos
│       │   ├── ChangesViewModel.cs         # Changes tab (commit)
│       │   ├── HistoryViewModel.cs         # Log/history tab
│       │   └── DiffViewModel.cs            # Diff viewer VM
│       ├── Views/
│       │   ├── MainWindow.xaml             # Shell window with sidebar + content area
│       │   ├── RepositoryListView.xaml     # Left panel: list of saved repos
│       │   ├── ChangesView.xaml            # Changes + commit panel
│       │   ├── HistoryView.xaml            # Log list view
│       │   └── DiffView.xaml               # Unified/side-by-side diff
│       ├── Services/
│       │   ├── SvnService.cs               # All SVN operations (status, commit, log, diff)
│       │   └── RepositoryStore.cs          # Persist saved repo paths (JSON to AppData)
│       └── Converters/                     # WPF value converters (status → icon, etc.)
└── CLAUDE.md
```

## Key Architecture Decisions

### MVVM Wiring
ViewModels use `CommunityToolkit.Mvvm` (source-generated `ObservableProperty`, `RelayCommand`). Views bind exclusively through DataContext — no code-behind logic.

### SVN Service
`SvnService` wraps either `SharpSvn` calls or spawns `svn.exe` subprocess commands. All methods are `async Task<T>` to keep the UI responsive. Prefer `SharpSvn` for structured data; fall back to CLI for operations not exposed in the binding.

### Repository Persistence
Saved repository paths are stored as JSON in `%APPDATA%\svnManager\repositories.json` via `RepositoryStore`. Loaded on startup, updated on add/remove.

### Diff Display
Diffs are rendered as syntax-highlighted text in a `RichTextBox` or `AvalonEdit` control. Removed lines shown in red, added in green — no external diff tool required.

## NuGet Dependencies

- `SharpSvn` — SVN operations
- `CommunityToolkit.Mvvm` — MVVM boilerplate reduction
- `Newtonsoft.Json` or `System.Text.Json` — repository list persistence
- `AvalonEdit` (optional) — syntax-highlighted diff/log viewer
