import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import {
  togglePath,
  setCheckedPaths,
  setCommitMessage,
  commitChanges,
  revertFiles,
  fetchDiff,
  fetchStatus,
} from '../../store/changesSlice'
import { DiffViewer } from '../Diff/DiffViewer'
import './ChangesView.css'

const STATUS_ICON: Record<string, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  conflicted: '!',
  unversioned: '?',
  missing: '~',
  replaced: 'R',
}

const STATUS_COLOR: Record<string, string> = {
  modified: '#89b4fa',
  added: '#a6e3a1',
  deleted: '#f38ba8',
  conflicted: '#f9e2af',
  unversioned: '#6c7086',
  missing: '#f9e2af',
}

export function ChangesView(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const { files, checkedPaths, commitMessage, activeDiff, loading, committing, error } =
    useSelector((s: RootState) => s.changes)
  const repoPath = useSelector((s: RootState) => s.repositories.selected?.path ?? '')

  const allChecked = files.length > 0 && checkedPaths.length === files.length
  const canCommit = checkedPaths.length > 0 && commitMessage.trim().length > 0 && !committing

  function handleSelectAll(): void {
    if (allChecked) {
      dispatch(setCheckedPaths([]))
    } else {
      dispatch(setCheckedPaths(files.map((f) => f.path)))
    }
  }

  function handleFileClick(path: string, status: string): void {
    if (status !== 'unversioned') {
      dispatch(fetchDiff({ repoPath, filePath: path }))
    }
  }

  function handleCommit(): void {
    if (!canCommit) return
    dispatch(commitChanges({ repoPath, message: commitMessage, paths: checkedPaths })).then(
      (action) => {
        if (commitChanges.fulfilled.match(action)) {
          dispatch(fetchStatus(repoPath))
        }
      }
    )
  }

  function handleRevert(paths: string[]): void {
    dispatch(revertFiles({ repoPath, paths }))
  }

  if (!repoPath) {
    return (
      <div className="changes-empty">
        <p>Select a repository from the sidebar</p>
      </div>
    )
  }

  return (
    <div className="changes-layout">
      <div className="changes-panel">
        <div className="changes-toolbar">
          <label className="select-all">
            <input type="checkbox" checked={allChecked} onChange={handleSelectAll} />
            <span>{files.length} changed file{files.length !== 1 ? 's' : ''}</span>
          </label>
          {loading && <span className="loading-badge">Refreshing…</span>}
        </div>

        {error && <div className="error-bar">{error}</div>}

        <ul className="file-list">
          {files.map((f) => (
            <li
              key={f.path}
              className={`file-item ${activeDiff?.filePath === f.path ? 'active' : ''}`}
              onClick={() => handleFileClick(f.path, f.status)}
            >
              <input
                type="checkbox"
                checked={checkedPaths.includes(f.path)}
                onChange={() => dispatch(togglePath(f.path))}
                onClick={(e) => e.stopPropagation()}
              />
              <span
                className="status-badge"
                style={{ color: STATUS_COLOR[f.status] ?? 'var(--text-muted)' }}
              >
                {STATUS_ICON[f.status] ?? '?'}
              </span>
              <span className="file-name" title={f.path}>
                {f.relativePath}
              </span>
              <button
                className="revert-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRevert([f.path])
                }}
                title="Revert"
              >
                ↺
              </button>
            </li>
          ))}
          {files.length === 0 && !loading && (
            <li className="file-empty">No changes</li>
          )}
        </ul>

        <div className="commit-area">
          <textarea
            className="commit-msg"
            placeholder="Summary (required)"
            value={commitMessage}
            onChange={(e) => dispatch(setCommitMessage(e.target.value))}
            rows={3}
          />
          <button
            className="commit-btn"
            disabled={!canCommit}
            onClick={handleCommit}
          >
            {committing ? 'Committing…' : `Commit to SVN`}
          </button>
        </div>
      </div>

      <div className="diff-panel">
        {activeDiff ? (
          <DiffViewer diff={activeDiff} />
        ) : (
          <div className="diff-empty">Select a file to view diff</div>
        )}
      </div>
    </div>
  )
}
