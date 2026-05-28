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
          <li className="history-empty">No history found</li>
        )}
      </ul>
    </div>
  )
}
