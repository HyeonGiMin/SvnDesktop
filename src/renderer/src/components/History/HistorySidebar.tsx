import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { selectEntry } from '../../store/historySlice'
import './HistorySidebar.css'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function HistorySidebar(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const { entries, selectedEntry, loading, error } = useSelector((s: RootState) => s.history)

  async function handleContextMenu(
    e: React.MouseEvent,
    entry: { revision: number; author: string; message: string }
  ): Promise<void> {
    e.preventDefault()
    await window.api.menu.commitContext({
      revision: entry.revision,
      author: entry.author,
      message: entry.message,
      x: Math.round(e.clientX),
      y: Math.round(e.clientY),
    })
  }

  return (
    <div className="history-sidebar">
      {loading && <div className="history-loading">Loading…</div>}
      {error && <div className="history-error">{error}</div>}
      <ul className="history-list">
        {entries.map(entry => (
          <li
            key={entry.revision}
            className={`history-item ${selectedEntry?.revision === entry.revision ? 'selected' : ''}`}
            onClick={() => dispatch(selectEntry(entry))}
            onContextMenu={e => handleContextMenu(e, entry)}
          >
            <div className="history-item-header">
              <span className="history-rev">r{entry.revision}</span>
              <span className="history-author">{entry.author}</span>
              <span className="history-date">{formatDate(entry.date)}</span>
            </div>
            <div className="history-msg">{entry.message || '(no message)'}</div>
          </li>
        ))}
        {entries.length === 0 && !loading && (
          <li className="history-empty">No commits found</li>
        )}
      </ul>
    </div>
  )
}
