import { ipcMain, BrowserWindow, Menu, shell } from 'electron'
import { IPC, Repository } from '../shared/types'
import * as svn from './svn/SvnClient'
import { loadRepositories, saveRepositories } from './svn/RepositoryStore'

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function buildPopupMenus(win: BrowserWindow): Record<string, Menu> {
  const sep = { type: 'separator' } as const
  return {
    file: Menu.buildFromTemplate([
      { label: 'Add Local Repository…', accelerator: 'CmdOrCtrl+O' },
      sep,
      { label: 'Exit', accelerator: 'Alt+F4', click: () => win.close() },
    ]),
    edit: Menu.buildFromTemplate([
      { role: 'undo' }, { role: 'redo' }, sep,
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
    ]),
    view: Menu.buildFromTemplate([
      { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }, sep,
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, sep,
      { role: 'togglefullscreen' },
    ]),
    repository: Menu.buildFromTemplate([
      { label: 'SVN Update' },
      { label: 'SVN Revert…' },
      sep,
      { label: 'Repository Settings…' },
    ]),
    branch: Menu.buildFromTemplate([
      { label: 'Switch Working Copy…' },
    ]),
    help: Menu.buildFromTemplate([
      { label: 'SVN Desktop on GitHub', click: () => shell.openExternal('https://github.com/HyeonGiMin/SvnDesktop') },
      sep,
      { label: 'About SVN Desktop' },
    ]),
  }
}

export function registerIpcHandlers(win: BrowserWindow): void {
  const popupMenus = buildPopupMenus(win)

  // ── Window controls ───────────────────────────────────────────────────────
  ipcMain.handle(IPC.WINDOW_MINIMIZE, () => win.minimize())
  ipcMain.handle(IPC.WINDOW_MAXIMIZE, () => {
    if (win.isMaximized()) win.unmaximize(); else win.maximize()
  })
  ipcMain.handle(IPC.WINDOW_CLOSE, () => win.close())
  ipcMain.handle(IPC.WINDOW_IS_MAXIMIZED, () => win.isMaximized())

  // ── Menu popup ────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.MENU_POPUP, (_e, menuId: string, x: number, y: number) => {
    const menu = popupMenus[menuId.toLowerCase()]
    if (menu) menu.popup({ window: win, x: Math.round(x), y: Math.round(y) })
  })

  // ── Repository persistence ─────────────────────────────────────────────────
  ipcMain.handle(IPC.REPOS_LIST, () => loadRepositories())

  ipcMain.handle(IPC.REPOS_ADD, (_e, name: string, path: string) => {
    const repos = loadRepositories()
    const existing = repos.find((r) => r.path === path)
    if (existing) return existing
    const repo: Repository = { id: randomId(), name, path, lastAccessed: Date.now() }
    repos.push(repo)
    saveRepositories(repos)
    return repo
  })

  ipcMain.handle(IPC.REPOS_REMOVE, (_e, id: string) => {
    const repos = loadRepositories().filter((r) => r.id !== id)
    saveRepositories(repos)
  })

  // ── SVN operations ─────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SVN_INFO, (_e, repoPath: string) => svn.getInfo(repoPath))
  ipcMain.handle(IPC.SVN_STATUS, (_e, repoPath: string) => svn.getStatus(repoPath))
  ipcMain.handle(
    IPC.SVN_COMMIT,
    (_e, repoPath: string, message: string, paths: string[]) =>
      svn.commit(repoPath, message, paths)
  )
  ipcMain.handle(IPC.SVN_LOG, (_e, repoPath: string, limit?: number) =>
    svn.getLog(repoPath, limit)
  )
  ipcMain.handle(IPC.SVN_DIFF, (_e, repoPath: string, filePath: string) =>
    svn.getDiff(repoPath, filePath)
  )
  ipcMain.handle(IPC.SVN_UPDATE, (_e, repoPath: string) => svn.update(repoPath))
  ipcMain.handle(IPC.SVN_REVERT, (_e, repoPath: string, paths: string[]) =>
    svn.revert(repoPath, paths)
  )
  ipcMain.handle(IPC.SVN_ADD, (_e, repoPath: string, paths: string[]) =>
    svn.addUnversioned(repoPath, paths)
  )
}
