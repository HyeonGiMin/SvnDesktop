import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'

const api = {
  window: {
    minimize: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC.WINDOW_CLOSE),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC.WINDOW_IS_MAXIMIZED),
    onMaximizeChange: (cb: (maximized: boolean) => void) => {
      ipcRenderer.on('window:maximized', () => cb(true))
      ipcRenderer.on('window:unmaximized', () => cb(false))
    },
  },
  menu: {
    popup: (menuId: string, x: number, y: number) =>
      ipcRenderer.invoke(IPC.MENU_POPUP, menuId, x, y),
  },
  repos: {
    list: (): Promise<{ repos: import('../shared/types').Repository[], lastSelectedId: string | null }> =>
      ipcRenderer.invoke(IPC.REPOS_LIST),
    add: (name: string, path: string) => ipcRenderer.invoke(IPC.REPOS_ADD, name, path),
    remove: (id: string) => ipcRenderer.invoke(IPC.REPOS_REMOVE, id),
    setLastSelected: (id: string | null): Promise<void> =>
      ipcRenderer.invoke(IPC.REPOS_SET_LAST_SELECTED, id),
    browseFolder: (defaultPath?: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC.DIALOG_BROWSE_FOLDER, defaultPath),
  },
  svn: {
    info: (repoPath: string) => ipcRenderer.invoke(IPC.SVN_INFO, repoPath),
    status: (repoPath: string) => ipcRenderer.invoke(IPC.SVN_STATUS, repoPath),
    commit: (repoPath: string, message: string, paths: string[]) =>
      ipcRenderer.invoke(IPC.SVN_COMMIT, repoPath, message, paths),
    log: (repoPath: string, limit?: number) => ipcRenderer.invoke(IPC.SVN_LOG, repoPath, limit),
    diff: (repoPath: string, filePath: string, ignoreWhitespace?: boolean) =>
      ipcRenderer.invoke(IPC.SVN_DIFF, repoPath, filePath, ignoreWhitespace),
    update: (repoPath: string) => ipcRenderer.invoke(IPC.SVN_UPDATE, repoPath),
    revert: (repoPath: string, paths: string[]) =>
      ipcRenderer.invoke(IPC.SVN_REVERT, repoPath, paths),
    add: (repoPath: string, paths: string[]) => ipcRenderer.invoke(IPC.SVN_ADD, repoPath, paths),
    checkout: (url: string, localPath: string): Promise<void> =>
      ipcRenderer.invoke(IPC.SVN_CHECKOUT, url, localPath),
    readFile: (filePath: string): Promise<import('../shared/types').SvnDiff> =>
      ipcRenderer.invoke(IPC.SVN_READ_FILE, filePath),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type AppApi = typeof api
