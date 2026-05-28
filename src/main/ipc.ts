import { ipcMain } from 'electron'
import { IPC, Repository } from '../shared/types'
import * as svn from './svn/SvnClient'
import { loadRepositories, saveRepositories } from './svn/RepositoryStore'

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function registerIpcHandlers(): void {
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
