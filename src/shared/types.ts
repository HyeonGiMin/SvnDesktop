export interface Repository {
  id: string
  name: string
  path: string
  url?: string
  lastAccessed: number
}

export type SvnStatusCode =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'conflicted'
  | 'unversioned'
  | 'missing'
  | 'replaced'
  | 'ignored'

export interface SvnFileStatus {
  path: string
  relativePath: string
  status: SvnStatusCode
}

export interface SvnLogPath {
  path: string
  action: 'M' | 'A' | 'D' | 'R'
}

export interface SvnLogEntry {
  revision: number
  author: string
  date: string
  message: string
  paths: SvnLogPath[]
}

export interface SvnDiff {
  filePath: string
  hunks: DiffHunk[]
  isPlainView?: boolean
}

export interface DiffHunk {
  header: string
  lines: DiffLine[]
}

export interface DiffLine {
  type: 'context' | 'added' | 'removed'
  content: string
  oldLineNo?: number
  newLineNo?: number
}

export interface SvnInfo {
  url: string
  revision: number
  author: string
  lastChangedDate: string
}

// IPC channel names
export const IPC = {
  SVN_INFO: 'svn:info',
  REPOS_LIST: 'repos:list',
  REPOS_ADD: 'repos:add',
  REPOS_REMOVE: 'repos:remove',
  SVN_STATUS: 'svn:status',
  SVN_COMMIT: 'svn:commit',
  SVN_LOG: 'svn:log',
  SVN_DIFF: 'svn:diff',
  SVN_UPDATE: 'svn:update',
  SVN_REVERT: 'svn:revert',
  SVN_ADD: 'svn:add',
  SVN_CHECKOUT: 'svn:checkout',
  SVN_READ_FILE: 'svn:readFile',
  DIALOG_BROWSE_FOLDER: 'dialog:browseFolder',
  REPOS_SET_LAST_SELECTED: 'repos:setLastSelected',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:isMaximized',
  MENU_POPUP: 'menu:popup',
} as const
