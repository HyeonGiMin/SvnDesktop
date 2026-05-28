import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { selectEntry, fetchRevisionDiff } from '../../store/historySlice'
import { DiffViewer } from '../Diff/DiffViewer'
import './HistoryView.css'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function HistoryView(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const { entries, selectedEntry, activeDiff, loading, error } = useSelector(
    (s: RootState) => s.history
  )
  const repoPath = useSelector((s: RootState) => s.repositories.selected?.path ?? '')

  if (!repoPath) {
    return (
      <div className="history-empty">
        <p>Select a repository from the sidebar</p>
      </div>
    )
  }

  return (
    <div className="history-layout">
      <div className="log-panel">
        {loading && <div className="log-loading">Loading…</div>}
        {error && <div className="log-error">{error}</div>}
        <ul className="log-list">
          {entries.map((entry) => (
            <li
              key={entry.revision}
              className={`log-item ${selectedEntry?.revision === entry.revision ? 'active' : ''}`}
              onClick={() => dispatch(selectEntry(entry))}
            >
              <div className="log-top">
                <span className="log-rev">r{entry.revision}</span>
                <span className="log-author">{entry.author}</span>
                <span className="log-date">{formatDate(entry.date)}</span>
              </div>
              <div className="log-msg">{entry.message || '(no message)'}</div>
            </li>
          ))}
          {entries.length === 0 && !loading && (
            <li className="log-empty">No history found</li>
          )}
        </ul>
      </div>

      <div className="log-detail">
        {selectedEntry ? (
          <>
            <div className="log-detail-header">
              <h3>r{selectedEntry.revision}</h3>
              <span className="log-detail-author">{selectedEntry.author}</span>
              <span className="log-detail-date">{formatDate(selectedEntry.date)}</span>
            </div>
            <p className="log-detail-msg">{selectedEntry.message || '(no message)'}</p>
            <div className="log-detail-paths">
              {selectedEntry.paths.map((p, i) => (
                <div
                  key={i}
                  className="log-path-item"
                  onClick={() => dispatch(fetchRevisionDiff({ repoPath, filePath: p.path }))}
                >
                  <span
                    className="log-path-action"
                    data-action={p.action}
                  >
                    {p.action}
                  </span>
                  <span className="log-path-name">{p.path}</span>
                </div>
              ))}
            </div>
            {activeDiff && (
              <div className="log-diff-area">
                <DiffViewer diff={activeDiff} />
              </div>
            )}
          </>
        ) : (
          <div className="log-detail-empty">Select a revision to view details</div>
        )}
      </div>
    </div>
  )
}
