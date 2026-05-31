import React, { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import {
  togglePath, addCheckedPaths, removeCheckedPaths, setCommitMessage,
  commitChanges, revertFiles, fetchDiff, fetchStatus,
} from '../../store/changesSlice'
import { pushToast } from '../../store/uiSlice'
import { useRepoRefresh } from '../../hooks/useRepoRefresh'
import './ChangesSidebar.css'

const STATUS_SYMBOL: Record<string, string> = {
  modified: 'M', added: '+', deleted: '−',
  conflicted: '!', unversioned: '?', missing: '~', replaced: 'R',
}

const STATUS_BG: Record<string, string> = {
  modified:    '#e3b341',
  added:       '#57ab5a',
  deleted:     '#e5534b',
  conflicted:  '#f47067',
  unversioned: '#768390',
  missing:     '#e5534b',
  replaced:    '#db61a2',
}

export function ChangesSidebar(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const refresh = useRepoRefresh()
  const { files, checkedPaths, commitMessage, activeDiff, diffLoading, loading, committing, error } =
    useSelector((s: RootState) => s.changes)
  const repoPath = useSelector((s: RootState) => s.repositories.selected?.path ?? '')
  const [filter, setFilter] = useState('')
  const commitRef = useRef<HTMLTextAreaElement>(null)

  const filtered = filter
    ? files.filter(f => f.relativePath.toLowerCase().includes(filter.toLowerCase()))
    : files

  const allFilteredChecked = filtered.length > 0 && filtered.every(f => checkedPaths.includes(f.path))
  const someFilteredChecked = filtered.some(f => checkedPaths.includes(f.path))
  const canCommit = checkedPaths.length > 0 && commitMessage.trim().length > 0 && !committing

  function handleSelectAll(): void {
    const filteredPaths = filtered.map(f => f.path)
    if (allFilteredChecked) {
      dispatch(removeCheckedPaths(filteredPaths))
    } else {
      dispatch(addCheckedPaths(filteredPaths))
    }
  }

  function handleFileClick(path: string, status: string): void {
    const noDiff = new Set(['missing', 'ignored'])
    if (!noDiff.has(status)) {
      dispatch(fetchDiff({ repoPath, filePath: path, status }))
    }
  }

  async function handleFileContextMenu(
    e: React.MouseEvent,
    f: { path: string; relativePath: string; status: string }
  ): Promise<void> {
    e.preventDefault()
    e.stopPropagation()
    const action = await window.api.menu.fileContext({
      filePath: f.path,
      relativePath: f.relativePath,
      status: f.status,
      x: Math.round(e.clientX),
      y: Math.round(e.clientY),
    })
    if (action === 'discard') {
      const targets = checkedPaths.includes(f.path) ? checkedPaths : [f.path]
      dispatch(revertFiles({ repoPath, paths: targets })).then(() => {
        dispatch(fetchStatus(repoPath))
      })
    }
  }

  function handleCommit(): void {
    if (!canCommit) return
    dispatch(commitChanges({ repoPath, message: commitMessage, paths: checkedPaths })).then(action => {
      if (commitChanges.fulfilled.match(action)) refresh()
      else if (commitChanges.rejected.match(action)) {
        dispatch(pushToast({ kind: 'error', message: action.error.message ?? 'Commit failed' }))
      }
    })
  }

  function handleCommitKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    }
  }

  function handleRevert(paths: string[]): void {
    dispatch(revertFiles({ repoPath, paths })).then(action => {
      if (revertFiles.fulfilled.match(action)) {
        dispatch(fetchStatus(repoPath))
      } else if (revertFiles.rejected.match(action)) {
        dispatch(pushToast({ kind: 'error', message: action.error.message ?? 'Revert failed' }))
      }
    })
  }

  return (
    <div className="changes-sidebar">
      <div className="filter-bar">
        <button className="filter-options-btn" title="Filter options">
          <FilterIcon />
        </button>
        <input
          className="filter-input"
          placeholder="Filter"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className="files-header">
        <label className="files-select-all">
          <input
            type="checkbox"
            checked={allFilteredChecked}
            onChange={handleSelectAll}
            ref={el => {
              if (el) el.indeterminate = someFilteredChecked && !allFilteredChecked
            }}
          />
          <span>{filtered.length} changed file{filtered.length !== 1 ? 's' : ''}</span>
        </label>
        {loading && <span className="loading-indicator">…</span>}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <ul className="file-list">
        {filtered.map(f => (
          <li
            key={f.path}
            className={`file-item ${activeDiff?.filePath === f.path && !diffLoading ? 'selected' : ''}`}
            onClick={() => handleFileClick(f.path, f.status)}
            onContextMenu={e => handleFileContextMenu(e, f)}
          >
            <input
              type="checkbox"
              checked={checkedPaths.includes(f.path)}
              onChange={() => dispatch(togglePath(f.path))}
              onClick={e => e.stopPropagation()}
            />
            <span className="file-name" title={f.path}>{f.relativePath}</span>
            <span
              className="file-status-icon"
              style={{ background: STATUS_BG[f.status] ?? '#768390' }}
              title={f.status}
            >
              {STATUS_SYMBOL[f.status] ?? '?'}
            </span>
            <button
              className="file-revert-btn"
              title="Discard changes"
              onClick={e => { e.stopPropagation(); handleRevert([f.path]) }}
            >
              <RevertIcon />
            </button>
          </li>
        ))}
        {filtered.length === 0 && !loading && (
          <li className="file-empty">
            {filter ? 'No files match the filter' : 'No local changes'}
          </li>
        )}
      </ul>

      <div className="commit-area">
        <textarea
          ref={commitRef}
          className="commit-message"
          placeholder="Commit message (Ctrl+Enter to commit)"
          value={commitMessage}
          onChange={e => dispatch(setCommitMessage(e.target.value))}
          onKeyDown={handleCommitKeyDown}
          rows={4}
        />
        <button
          className="commit-btn"
          disabled={!canCommit}
          onClick={handleCommit}
        >
          {committing
            ? 'Committing…'
            : `Commit${checkedPaths.length > 0 ? ` ${checkedPaths.length} file${checkedPaths.length !== 1 ? 's' : ''}` : ''} to SVN`
          }
        </button>
      </div>
    </div>
  )
}

function FilterIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path fill="currentColor" d="M.75 3h14.5a.75.75 0 010 1.5H.75A.75.75 0 010 3.75.75.75 0 01.75 3zm2 5h10.5a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5zm3 5h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 010-1.5z" />
    </svg>
  )
}

function RevertIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path fill="currentColor" d="M1.705 8.005a.75.75 0 01.834.656 5.5 5.5 0 009.592 2.97l-1.204-1.204a.25.25 0 01.177-.427h3.646a.25.25 0 01.25.25v3.646a.25.25 0 01-.427.177l-1.38-1.38A7.002 7.002 0 011.05 8.84a.75.75 0 01.656-.834zM8 2.5a5.487 5.487 0 00-4.131 1.869l1.204 1.204A.25.25 0 014.896 6H1.25A.25.25 0 011 5.75V2.104a.25.25 0 01.427-.177l1.38 1.38A7.002 7.002 0 0114.95 7.16a.75.75 0 01-1.49.178A5.5 5.5 0 008 2.5z" />
    </svg>
  )
}
