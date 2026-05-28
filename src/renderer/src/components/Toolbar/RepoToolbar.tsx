import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import {
  fetchRepositories,
  addRepository,
  removeRepository,
  selectRepository,
} from '../../store/repositoriesSlice'
import { fetchStatus } from '../../store/changesSlice'
import { fetchLog } from '../../store/historySlice'
import type { Tab } from '../../App'
import './RepoToolbar.css'

interface Props {
  tab: Tab
  onTabChange: (t: Tab) => void
}

export function RepoToolbar({ tab, onTabChange }: Props): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const { list, selected } = useSelector((s: RootState) => s.repositories)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPath, setNewPath] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch(fetchRepositories())
  }, [dispatch])

  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setAdding(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(repo: (typeof list)[0]): void {
    dispatch(selectRepository(repo))
    dispatch(fetchStatus(repo.path))
    dispatch(fetchLog({ repoPath: repo.path }))
    setOpen(false)
  }

  function handleAdd(): void {
    if (!newPath.trim()) return
    const name = newName.trim() || newPath.split(/[\\/]/).pop() || newPath
    dispatch(addRepository({ name, path: newPath.trim() })).then((action) => {
      if (addRepository.fulfilled.match(action)) {
        dispatch(fetchStatus(action.payload.path))
        dispatch(fetchLog({ repoPath: action.payload.path }))
      }
    })
    setAdding(false)
    setNewName('')
    setNewPath('')
    setOpen(false)
  }

  function handleUpdate(): void {
    if (selected) {
      dispatch(fetchStatus(selected.path))
      dispatch(fetchLog({ repoPath: selected.path }))
    }
  }

  return (
    <header className="toolbar" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      {/* Left: Current Repository dropdown */}
      <div
        className="toolbar-left"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        ref={dropdownRef}
      >
        <button
          className={`repo-btn ${open ? 'active' : ''}`}
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="repo-icon" viewBox="0 0 16 16" width="16" height="16">
            <path
              fill="currentColor"
              d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"
            />
          </svg>
          <span className="repo-btn-label">Current Repository</span>
          <span className="repo-btn-name">{selected?.name ?? 'No Repository'}</span>
          <svg className="chevron" viewBox="0 0 16 16" width="12" height="12">
            <path fill="currentColor" d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z" />
          </svg>
        </button>

        {open && (
          <div className="repo-dropdown">
            <div className="dropdown-header">
              <span>Repositories</span>
              <button
                className="add-repo-trigger"
                onClick={() => setAdding((v) => !v)}
                title="Add repository"
              >
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <path fill="currentColor" d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z" />
                </svg>
              </button>
            </div>

            {adding && (
              <div className="add-form">
                <input
                  autoFocus
                  placeholder="Name (optional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <input
                  placeholder="Path  e.g. C:\repos\myproject"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <div className="add-form-actions">
                  <button className="btn-primary-sm" onClick={handleAdd}>Add</button>
                  <button className="btn-ghost-sm" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </div>
            )}

            <ul className="dropdown-list">
              {list.map((repo) => (
                <li
                  key={repo.id}
                  className={`dropdown-item ${selected?.id === repo.id ? 'active' : ''}`}
                  onClick={() => handleSelect(repo)}
                >
                  {selected?.id === repo.id && (
                    <svg className="check-icon" viewBox="0 0 16 16" width="12" height="12">
                      <path fill="currentColor" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  )}
                  <span className="dropdown-item-name">{repo.name}</span>
                  <span className="dropdown-item-path">{repo.path}</span>
                  <button
                    className="dropdown-item-remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      dispatch(removeRepository(repo.id))
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
              {list.length === 0 && !adding && (
                <li className="dropdown-empty">
                  No repositories yet.<br />Click + to add one.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Center: tabs */}
      <div
        className="toolbar-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="tab-group">
          <button
            className={`toolbar-tab ${tab === 'changes' ? 'active' : ''}`}
            onClick={() => onTabChange('changes')}
          >
            Changes
          </button>
          <button
            className={`toolbar-tab ${tab === 'history' ? 'active' : ''}`}
            onClick={() => onTabChange('history')}
          >
            History
          </button>
        </div>
      </div>

      {/* Right: Update/Fetch */}
      <div
        className="toolbar-right"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {selected && (
          <button className="update-btn" onClick={handleUpdate} title="Refresh status">
            <svg viewBox="0 0 16 16" width="14" height="14">
              <path
                fill="currentColor"
                d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"
              />
            </svg>
            <span>Refresh</span>
          </button>
        )}
      </div>
    </header>
  )
}
