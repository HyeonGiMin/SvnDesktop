import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'

const api = {
  repos: {
    list: () => ipcRenderer.invoke(IPC.REPOS_LIST),
    add: (name: string, path: string) => ipcRenderer.invoke(IPC.REPOS_ADD, name, path),
    remove: (id: string) => ipcRenderer.invoke(IPC.REPOS_REMOVE, id),
  },
  svn: {
    info: (repoPath: string) => ipcRenderer.invoke(IPC.SVN_INFO, repoPath),
    status: (repoPath: string) => ipcRenderer.invoke(IPC.SVN_STATUS, repoPath),
    commit: (repoPath: string, message: string, paths: string[]) =>
      ipcRenderer.invoke(IPC.SVN_COMMIT, repoPath, message, paths),
    log: (repoPath: string, limit?: number) => ipcRenderer.invoke(IPC.SVN_LOG, repoPath, limit),
    diff: (repoPath: string, filePath: string) =>
      ipcRenderer.invoke(IPC.SVN_DIFF, repoPath, filePath),
    update: (repoPath: string) => ipcRenderer.invoke(IPC.SVN_UPDATE, repoPath),
    revert: (repoPath: string, paths: string[]) =>
      ipcRenderer.invoke(IPC.SVN_REVERT, repoPath, paths),
    add: (repoPath: string, paths: string[]) => ipcRenderer.invoke(IPC.SVN_ADD, repoPath, paths),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type AppApi = typeof api
