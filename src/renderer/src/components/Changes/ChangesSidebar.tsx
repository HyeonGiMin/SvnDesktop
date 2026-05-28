import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import {
  togglePath, setCheckedPaths, setCommitMessage,
  commitChanges, revertFiles, fetchDiff, fetchStatus,
  setSummary, setDescription,
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
  const { files, checkedPaths, summary, description, activeDiff, loading, committing, error } =
    useSelector((s: RootState) => s.changes)
  const repoPath = useSelector((s: RootState) => s.repositories.selected?.path ?? '')
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? files.filter(f => f.relativePath.toLowerCase().includes(filter.toLowerCase()))
    : files

  const allChecked = filtered.length > 0 && filtered.every(f => checkedPaths.includes(f.path))
  const canCommit = checkedPaths.length > 0 && summary.trim().length > 0 && !committing

  function handleSelectAll(): void {
    if (allChecked) dispatch(setCheckedPaths([]))
    else dispatch(setCheckedPaths(filtered.map(f => f.path)))
  }

  function handleFileClick(path: string, status: string): void {
    if (status !== 'deleted') {
      dispatch(fetchDiff({ repoPath, filePath: path }))
    }
  }

  function handleCommit(): void {
    if (!canCommit) return
    const message = description.trim() ? `${summary}\n\n${description}` : summary
    dispatch(commitChanges({ repoPath, message, paths: checkedPaths })).then(action => {
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
        <div className="commit-summary-row">
          <div className="commit-avatar" aria-hidden>
            <AvatarIcon />
          </div>
          <input
            className="commit-summary"
            placeholder="Summary (required)"
            value={summary}
            onChange={e => dispatch(setSummary(e.target.value))}
            maxLength={72}
          />
        </div>
        <textarea
          className="commit-description"
          placeholder="Description"
          value={description}
          onChange={e => dispatch(setDescription(e.target.value))}
          rows={3}
        />
        <div className="commit-footer">
          <div className="commit-actions-left">
            <button className="commit-action-btn" title="Add co-author">
              <CoAuthorIcon />
            </button>
          </div>
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

function AvatarIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path fill="currentColor" d="M10.561 8.073a6.005 6.005 0 013.432 5.142.75.75 0 11-1.498.07 4.5 4.5 0 00-8.99 0 .75.75 0 01-1.498-.07 6.004 6.004 0 013.431-5.142 3.999 3.999 0 116.123 0zM10.5 5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  )
}

function CoAuthorIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path fill="currentColor" d="M2 5.5a3.5 3.5 0 115.898 2.549 5.508 5.508 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.493 3.493 0 012 5.5zM11 4a.75.75 0 100 1.5 1.5 1.5 0 01.666 2.844.75.75 0 00-.416.672v.352a.75.75 0 00.574.73c1.2.289 2.162 1.2 2.522 2.372a.75.75 0 101.434-.44 5.01 5.01 0 00-2.56-3.012A3 3 0 0011 4z" />
    </svg>
  )
}
