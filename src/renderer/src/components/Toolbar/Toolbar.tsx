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
import { pushToast } from '../../store/uiSlice'
import { useRepoRefresh } from '../../hooks/useRepoRefresh'
import { AddRepositoryDialog } from './AddRepositoryDialog'
import { CloneRepositoryDialog } from './CloneRepositoryDialog'
import './Toolbar.css'

type Dialog = 'add' | 'clone' | null

export function Toolbar(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const { list, selected, svnInfo } = useSelector((s: RootState) => s.repositories)

  const [repoOpen, setRepoOpen] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [updating, setUpdating] = useState(false)

  const repoRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    dispatch(fetchRepositories()).then((action) => {
      if (!fetchRepositories.fulfilled.match(action)) return
      const { repos, lastSelectedId } = action.payload
      if (!lastSelectedId) return
      const repo = repos.find(r => r.id === lastSelectedId)
      if (!repo) return
      dispatch(selectRepository(repo))
      dispatch(fetchStatus(repo.path))
      dispatch(fetchLog({ repoPath: repo.path }))
    })
  }, [dispatch])

  useEffect(() => {
    function close(e: MouseEvent): void {
      if (repoRef.current && !repoRef.current.contains(e.target as Node)) {
        setRepoOpen(false)
        setFilterText('')
        setAddMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (repoOpen) setTimeout(() => filterRef.current?.focus(), 0)
  }, [repoOpen])

  const filteredList = filterText.trim()
    ? list.filter(r =>
        r.name.toLowerCase().includes(filterText.toLowerCase()) ||
        r.path.toLowerCase().includes(filterText.toLowerCase())
      )
    : list

  function closeDropdown(): void {
    setRepoOpen(false)
    setFilterText('')
    setAddMenuOpen(false)
  }

  function handleSelect(repo: (typeof list)[0]): void {
    dispatch(selectRepository(repo))
    dispatch(fetchStatus(repo.path))
    dispatch(fetchLog({ repoPath: repo.path }))
    window.api.repos.setLastSelected(repo.id)
    closeDropdown()
  }

  function handleAdd(name: string, path: string): void {
    dispatch(addRepository({ name, path })).then((action) => {
      if (addRepository.fulfilled.match(action)) {
        dispatch(fetchStatus(action.payload.path))
        dispatch(fetchLog({ repoPath: action.payload.path }))
      }
    })
    setDialog(null)
  }

  async function handleClone(url: string, localPath: string, name: string): Promise<void> {
    await window.api.svn.checkout(url, localPath)
    dispatch(addRepository({ name, path: localPath })).then((action) => {
      if (addRepository.fulfilled.match(action)) {
        dispatch(fetchStatus(action.payload.path))
        dispatch(fetchLog({ repoPath: action.payload.path }))
      }
    })
    setDialog(null)
  }

  const refresh = useRepoRefresh()

  async function handleUpdate(): Promise<void> {
    if (!selected || updating) return
    setUpdating(true)
    try {
      await window.api.svn.update(selected.path)
      dispatch(pushToast({ kind: 'success', message: 'SVN Update completed' }))
      refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SVN Update failed'
      dispatch(pushToast({ kind: 'error', message: msg }))
    } finally {
      setUpdating(false)
    }
  }

  const revLabel = svnInfo ? `r${svnInfo.revision}` : '—'
  const urlLabel = svnInfo ? svnInfo.url.split('/').slice(-2).join('/') : 'No working copy'

  return (
    <>
      <div className="toolbar">
        {/* ── Section 1: Current repository ── */}
        <div className="toolbar-section sidebar-section" ref={repoRef}>
          <button
            className={`toolbar-btn repo-btn ${repoOpen ? 'open' : ''}`}
            onClick={() => { setRepoOpen(v => !v); setAddMenuOpen(false) }}
          >
            <RepoIcon />
            <div className="toolbar-btn-text">
              <span className="toolbar-btn-label">Current repository</span>
              <span className="toolbar-btn-title">{selected?.name ?? 'No Repository'}</span>
            </div>
            <Chevron open={repoOpen} />
          </button>

          {repoOpen && <div className="toolbar-overlay" onClick={closeDropdown} />}

          {repoOpen && (
            <div className="toolbar-dropdown repo-dropdown">
              {/* Filter row */}
              <div className="dropdown-filter-row">
                <div className="dropdown-filter-input-wrap">
                  <SearchIcon />
                  <input
                    ref={filterRef}
                    className="dropdown-filter-input"
                    placeholder="Filter"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && closeDropdown()}
                  />
                  {filterText && (
                    <button className="dropdown-filter-clear" onClick={() => setFilterText('')}>
                      <ClearIcon />
                    </button>
                  )}
                </div>

                {/* Add button with sub-menu */}
                <div className="add-menu-wrap">
                  <button
                    className={`dropdown-add-btn ${addMenuOpen ? 'open' : ''}`}
                    onClick={e => { e.stopPropagation(); setAddMenuOpen(v => !v) }}
                    title="Add repository"
                  >
                    <PlusIcon />
                  </button>
                  {addMenuOpen && (
                    <div className="add-submenu">
                      <button className="add-submenu-item" onClick={() => { setDialog('add'); closeDropdown() }}>
                        Add existing repository…
                      </button>
                      <button className="add-submenu-item" onClick={() => { setDialog('clone'); closeDropdown() }}>
                        Clone repository…
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Repository list */}
              <ul className="dropdown-list">
                {filteredList.map(repo => (
                  <li
                    key={repo.id}
                    className={`dropdown-item ${selected?.id === repo.id ? 'active' : ''}`}
                    onClick={() => handleSelect(repo)}
                  >
                    <span className="dropdown-item-check">
                      {selected?.id === repo.id && <CheckIcon />}
                    </span>
                    <div className="dropdown-item-info">
                      <span className="dropdown-item-name">{repo.name}</span>
                      <span className="dropdown-item-path">{repo.path}</span>
                    </div>
                    <button
                      className="dropdown-item-remove"
                      onClick={e => { e.stopPropagation(); dispatch(removeRepository(repo.id)) }}
                    >×</button>
                  </li>
                ))}
                {filteredList.length === 0 && (
                  <li className="dropdown-empty">
                    {filterText ? `No repositories matching "${filterText}"` : 'No repositories yet'}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="toolbar-divider" />

        {/* ── Section 2: Working copy ── */}
        <div className="toolbar-section branch-section">
          <button className="toolbar-btn branch-btn" disabled={!selected}>
            <SvnBranchIcon />
            <div className="toolbar-btn-text">
              <span className="toolbar-btn-label">Working copy</span>
              <span className="toolbar-btn-title">{selected ? revLabel : '—'}</span>
            </div>
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* ── Section 3: SVN Update ── */}
        <div className="toolbar-section fetch-section">
          <button
            className={`toolbar-btn fetch-btn ${updating ? 'updating' : ''}`}
            onClick={handleUpdate}
            disabled={!selected || updating}
          >
            <UpdateIcon spin={updating} />
            <div className="toolbar-btn-text">
              <span className="toolbar-btn-label">{updating ? 'Updating…' : 'SVN Update'}</span>
              {svnInfo && !updating && (
                <span className="toolbar-btn-label">{urlLabel}</span>
              )}
            </div>
          </button>
        </div>
      </div>

      {dialog === 'add' && (
        <AddRepositoryDialog onAdd={handleAdd} onDismiss={() => setDialog(null)} />
      )}
      {dialog === 'clone' && (
        <CloneRepositoryDialog onClone={handleClone} onDismiss={() => setDialog(null)} />
      )}
    </>
  )
}

/* ── SVG icons ─────────────────────────────────────────────────────────── */
function RepoIcon(): JSX.Element {
  return (
    <svg className="toolbar-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path fill="currentColor" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z" />
    </svg>
  )
}

function SvnBranchIcon(): JSX.Element {
  return (
    <svg className="toolbar-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path fill="currentColor" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 019 8.5H8v1.378a2.251 2.251 0 11-1.5 0V8.5H5A2.5 2.5 0 012.5 6v-.628a2.25 2.25 0 111.5 0V6c0 .55.45 1 1 1h4.5a1 1 0 001-1v-.372A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" />
    </svg>
  )
}

function UpdateIcon({ spin }: { spin: boolean }): JSX.Element {
  return (
    <svg className={`toolbar-icon ${spin ? 'spin' : ''}`} viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path fill="currentColor" d="M1.705 8.005a.75.75 0 01.834.656 5.5 5.5 0 009.592 2.97l-1.204-1.204a.25.25 0 01.177-.427h3.646a.25.25 0 01.25.25v3.646a.25.25 0 01-.427.177l-1.38-1.38A7.002 7.002 0 011.05 8.84a.75.75 0 01.656-.834zM8 2.5a5.487 5.487 0 00-4.131 1.869l1.204 1.204A.25.25 0 014.896 6H1.25A.25.25 0 011 5.75V2.104a.25.25 0 01.427-.177l1.38 1.38A7.002 7.002 0 0114.95 7.16a.75.75 0 01-1.49.178A5.5 5.5 0 008 2.5z" />
    </svg>
  )
}

function Chevron({ open }: { open: boolean }): JSX.Element {
  return (
    <svg
      className="chevron-icon"
      style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
      viewBox="0 0 16 16" width="12" height="12" aria-hidden
    >
      <path fill="currentColor" d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z" />
    </svg>
  )
}

function PlusIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path fill="currentColor" d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z" />
    </svg>
  )
}

function CheckIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path fill="currentColor" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
    </svg>
  )
}

function SearchIcon(): JSX.Element {
  return (
    <svg className="filter-search-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path fill="currentColor" d="M10.68 11.74a6 6 0 01-7.922-8.982 6 6 0 018.982 7.922l3.04 3.04a.749.749 0 11-1.06 1.06l-3.04-3.04zM11.5 7a4.499 4.499 0 11-8.997 0A4.499 4.499 0 0111.5 7z" />
    </svg>
  )
}

function ClearIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path fill="currentColor" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.749.749 0 111.06 1.06L9.06 8l3.22 3.22a.749.749 0 11-1.06 1.06L8 9.06l-3.22 3.22a.749.749 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
    </svg>
  )
}
