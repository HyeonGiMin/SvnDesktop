import React, { useEffect, useState } from 'react'
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
import './Sidebar.css'

export function Sidebar(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const { list, selected } = useSelector((s: RootState) => s.repositories)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPath, setNewPath] = useState('')

  useEffect(() => {
    dispatch(fetchRepositories())
  }, [dispatch])

  function handleSelect(repo: (typeof list)[0]): void {
    dispatch(selectRepository(repo))
    dispatch(fetchStatus(repo.path))
    dispatch(fetchLog({ repoPath: repo.path }))
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
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>Repositories</span>
        <button className="icon-btn" onClick={() => setAdding(true)} title="Add repository">
          +
        </button>
      </div>

      {adding && (
        <div className="add-repo-form">
          <input
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
          <div className="add-repo-actions">
            <button className="btn-primary" onClick={handleAdd}>
              Add
            </button>
            <button className="btn-ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="repo-list">
        {list.map((repo) => (
          <li
            key={repo.id}
            className={`repo-item ${selected?.id === repo.id ? 'active' : ''}`}
            onClick={() => handleSelect(repo)}
          >
            <span className="repo-icon">📁</span>
            <span className="repo-name">{repo.name}</span>
            <button
              className="repo-remove"
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
          <li className="repo-empty">No repositories added</li>
        )}
      </ul>
    </aside>
  )
}
