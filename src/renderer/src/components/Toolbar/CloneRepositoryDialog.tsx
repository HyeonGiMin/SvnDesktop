import React, { useState } from 'react'
import './AddRepositoryDialog.css'

interface Props {
  onClone: (url: string, localPath: string, name: string) => Promise<void>
  onDismiss: () => void
}

export function CloneRepositoryDialog({ onClone, onDismiss }: Props): JSX.Element {
  const [url, setUrl] = useState('')
  const [localPath, setLocalPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBrowse(): Promise<void> {
    const selected = await window.api.repos.browseFolder()
    if (selected) setLocalPath(selected)
  }

  async function handleSubmit(): Promise<void> {
    const trimmedUrl = url.trim()
    const trimmedPath = localPath.trim()
    if (!trimmedUrl) { setError('Please enter a repository URL.'); return }
    if (!trimmedPath) { setError('Please enter a local path.'); return }

    setLoading(true)
    setError('')
    try {
      const name = trimmedUrl.split('/').filter(Boolean).pop() || trimmedUrl
      await onClone(trimmedUrl, trimmedPath, name)
    } catch (err: unknown) {
      setError((err as Error).message || 'Clone failed.')
      setLoading(false)
    }
  }

  const canSubmit = url.trim().length > 0 && localPath.trim().length > 0 && !loading

  return (
    <div className="dialog-backdrop" onClick={loading ? undefined : onDismiss}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Clone a repository</h2>
        </div>
        <div className="dialog-content">
          <div className="dialog-field">
            <label>Repository URL</label>
            <input
              autoFocus
              type="text"
              placeholder="svn://example.com/repos/project"
              value={url}
              onChange={e => { setUrl(e.target.value); setError('') }}
              disabled={loading}
            />
          </div>
          <div className="dialog-field">
            <label>Local path</label>
            <div className="dialog-path-row">
              <input
                type="text"
                placeholder="local path"
                value={localPath}
                onChange={e => { setLocalPath(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={loading}
              />
              <button className="btn-secondary" onClick={handleBrowse} disabled={loading}>
                Choose…
              </button>
            </div>
          </div>
          {error && <p className="dialog-error">{error}</p>}
          {loading && <p className="dialog-info">Cloning… this may take a while.</p>}
        </div>
        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onDismiss} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? 'Cloning…' : 'Clone'}
          </button>
        </div>
      </div>
    </div>
  )
}
