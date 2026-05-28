import React from 'react'
import './EmptyState.css'

export function EmptyState(): JSX.Element {
  return (
    <div className="empty-state">
      <div className="empty-illustration">
        <svg viewBox="0 0 200 160" width="200" height="160" fill="none">
          {/* Folder stack illustration */}
          <rect x="20" y="60" width="160" height="90" rx="8" fill="#2a2e3d" stroke="#373d4d" strokeWidth="1.5"/>
          <rect x="20" y="50" width="80" height="20" rx="4" fill="#2a2e3d" stroke="#373d4d" strokeWidth="1.5"/>
          <rect x="30" y="75" width="140" height="8" rx="4" fill="#373d4d"/>
          <rect x="30" y="91" width="100" height="8" rx="4" fill="#373d4d"/>
          <rect x="30" y="107" width="120" height="8" rx="4" fill="#373d4d"/>
          <rect x="30" y="123" width="80" height="8" rx="4" fill="#373d4d"/>
          {/* SVN badge */}
          <rect x="130" y="110" width="42" height="26" rx="5" fill="#58a6ff"/>
          <text x="151" y="128" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="monospace">SVN</text>
        </svg>
      </div>
      <h2 className="empty-title">Let's get started!</h2>
      <p className="empty-desc">
        Add an SVN working copy to start tracking changes, viewing history, and committing.
      </p>
      <p className="empty-hint">
        Click <strong>Current Repository</strong> in the toolbar and press <strong>+</strong> to add a repository.
      </p>
    </div>
  )
}
