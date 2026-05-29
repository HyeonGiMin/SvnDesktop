import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import {
  togglePath, setCheckedPaths, setCommitMessage,
  commitChanges, revertFiles, fetchDiff, fetchStatus,
} from '../../store/changesSlice'
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
  const { files, checkedPaths, commitMessage, activeDiff, loading, committing, error } =
    useSelector((s: RootState) => s.changes)
  const repoPath = useSelector((s: RootState) => s.repositories.selected?.path ?? '')
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? files.filter(f => f.relativePath.toLowerCase().includes(filter.toLowerCase()))
    : files

  const allChecked = filtered.length > 0 && filtered.every(f => checkedPaths.includes(f.path))
  const canCommit = checkedPaths.length > 0 && commitMessage.trim().length > 0 && !committing

  function handleSelectAll(): void {
    if (allChecked) dispatch(setCheckedPaths([]))
    else dispatch(setCheckedPaths(filtered.map(f => f.path)))
  }

  function handleFileClick(path: string, status: string): void {
    const noDiff = new Set(['missing', 'ignored'])
    if (!noDiff.has(status)) {
      dispatch(fetchDiff({ repoPath, filePath: path, status }))
    }
  }

  function handleCommit(): void {
    if (!canCommit) return
    dispatch(commitChanges({ repoPath, message: commitMessage, paths: checkedPaths })).then(action => {
      if (commitChanges.fulfilled.match(action)) dispatch(fetchStatus(repoPath))
    })
  }

  return (
    <div className="changes-sidebar">
      {/* Filter bar */}
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

      {/* Files header */}
      <div className="files-header">
        <label className="files-select-all">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={handleSelectAll}
            ref={el => { if (el) el.indeterminate = checkedPaths.length > 0 && !allChecked }}
          />
          <span>{filtered.length} changed file{filtered.length !== 1 ? 's' : ''}</span>
        </label>
        {loading && <span className="loading-indicator">…</span>}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* File list */}
      <ul className="file-list">
        {filtered.map(f => (
          <li
            key={f.path}
            className={`file-item ${activeDiff?.filePath === f.path ? 'selected' : ''}`}
            onClick={() => handleFileClick(f.path, f.status)}
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
          </li>
        ))}
        {filtered.length === 0 && !loading && (
          <li className="file-empty">
            {filter ? 'No files match the filter' : 'No local changes'}
          </li>
        )}
      </ul>

      {/* Commit area */}
      <div className="commit-area">
        <textarea
          className="commit-message"
          placeholder="Commit message (required)"
          value={commitMessage}
          onChange={e => dispatch(setCommitMessage(e.target.value))}
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
