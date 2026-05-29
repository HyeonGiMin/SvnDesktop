import React, { useState } from 'react'
import './AddRepositoryDialog.css'

interface Props {
  onAdd: (name: string, path: string) => void
  onDismiss: () => void
}

export function AddRepositoryDialog({ onAdd, onDismiss }: Props): JSX.Element {
  const [path, setPath] = useState('')
  const [error, setError] = useState('')

  async function handleBrowse(): Promise<void> {
    const selected = await window.api.repos.browseFolder()
    if (selected) setPath(selected)
  }

  function handleSubmit(): void {
    const trimmed = path.trim()
    if (!trimmed) {
      setError('Please enter a local path.')
      return
    }
    const name = trimmed.split(/[\\/]/).filter(Boolean).pop() || trimmed
    onAdd(name, trimmed)
  }

  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Add local repository</h2>
        </div>
        <div className="dialog-content">
          <div className="dialog-field">
            <label>Local path</label>
            <div className="dialog-path-row">
              <input
                autoFocus
                type="text"
                placeholder="repository path"
                value={path}
                onChange={e => { setPath(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button className="btn-secondary" onClick={handleBrowse}>Choose…</button>
            </div>
            {error && <p className="dialog-error">{error}</p>}
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onDismiss}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!path.trim()}>
            Add repository
          </button>
        </div>
      </div>
    </div>
  )
}
