import { ipcMain, BrowserWindow, Menu, shell, dialog, clipboard } from 'electron'
import { IPC, Repository } from '../shared/types'
import * as svn from './svn/SvnClient'
import { loadRepositories, saveRepositories, loadLastSelectedId, saveLastSelectedId } from './svn/RepositoryStore'

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
  ipcMain.handle(IPC.REPOS_LIST, () => ({
    repos: loadRepositories(),
    lastSelectedId: loadLastSelectedId(),
  }))

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
  ipcMain.handle(IPC.REPOS_SET_LAST_SELECTED, (_e, id: string | null) => {
    saveLastSelectedId(id)
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
  ipcMain.handle(IPC.SVN_DIFF, (_e, repoPath: string, filePath: string, ignoreWhitespace?: boolean) =>
    svn.getDiff(repoPath, filePath, ignoreWhitespace)
  )
  ipcMain.handle(IPC.SVN_UPDATE, (_e, repoPath: string) => svn.update(repoPath))
  ipcMain.handle(IPC.SVN_REVERT, (_e, repoPath: string, paths: string[]) =>
    svn.revert(repoPath, paths)
  )
  ipcMain.handle(IPC.SVN_ADD, (_e, repoPath: string, paths: string[]) =>
    svn.addUnversioned(repoPath, paths)
  )
  ipcMain.handle(IPC.SVN_READ_FILE, (_e, filePath: string) =>
    svn.readFileAsDiff(filePath)
  )
  ipcMain.handle(IPC.SVN_CHECKOUT, (_e, url: string, localPath: string) =>
    svn.checkout(url, localPath)
  )
  // ── Shell / clipboard ─────────────────────────────────────────────────────
  ipcMain.handle(IPC.SHELL_OPEN_PATH, (_e, p: string) => shell.openPath(p))
  ipcMain.handle(IPC.SHELL_SHOW_FOLDER, (_e, p: string) => shell.showItemInFolder(p))
  ipcMain.handle(IPC.CLIPBOARD_WRITE, (_e, text: string) => { clipboard.writeText(text) })

  // ── File context menu ─────────────────────────────────────────────────────
  ipcMain.handle(
    IPC.MENU_FILE_CONTEXT,
    (_e, { filePath, relativePath, status, x, y }: {
      filePath: string; relativePath: string; status: string; x: number; y: number
    }) =>
      new Promise<string | null>(resolve => {
        const sep = { type: 'separator' } as const
        const versioned = !['unversioned', 'ignored'].includes(status)
        const template = [
          {
            label: 'Open in Editor',
            click: () => { shell.openPath(filePath); resolve(null) },
          },
          {
            label: 'Show in Explorer',
            click: () => { shell.showItemInFolder(filePath); resolve(null) },
          },
          sep,
          {
            label: 'Copy Path',
            click: () => { clipboard.writeText(filePath); resolve(null) },
          },
          {
            label: 'Copy Relative Path',
            click: () => { clipboard.writeText(relativePath); resolve(null) },
          },
          ...(versioned ? [sep, {
            label: 'Discard Changes',
            click: () => resolve('discard'),
          }] : []),
        ]
        const menu = Menu.buildFromTemplate(template as Electron.MenuItemConstructorOptions[])
        menu.popup({ window: win, x: Math.round(x), y: Math.round(y), callback: () => resolve(null) })
      })
  )

  // ── Commit context menu ───────────────────────────────────────────────────
  ipcMain.handle(
    IPC.MENU_COMMIT_CONTEXT,
    (_e, { revision, author, message, x, y }: {
      revision: number; author: string; message: string; x: number; y: number
    }) =>
      new Promise<null>(resolve => {
        const sep = { type: 'separator' } as const
        const template = [
          {
            label: `Copy Revision Number (r${revision})`,
            click: () => { clipboard.writeText(String(revision)); resolve(null) },
          },
          {
            label: 'Copy Author',
            click: () => { clipboard.writeText(author); resolve(null) },
          },
          sep,
          {
            label: 'Copy Commit Message',
            click: () => { clipboard.writeText(message); resolve(null) },
          },
        ]
        const menu = Menu.buildFromTemplate(template as Electron.MenuItemConstructorOptions[])
        menu.popup({ window: win, x: Math.round(x), y: Math.round(y), callback: () => resolve(null) })
      })
  )

  ipcMain.handle(IPC.DIALOG_BROWSE_FOLDER, async (_e, defaultPath?: string) => {
    const result = await dialog.showOpenDialog(win, {
      defaultPath,
      properties: ['openDirectory', 'createDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
