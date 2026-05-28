import React from 'react'
import './EmptyState.css'

export function EmptyState(): JSX.Element {
  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden>
        <svg viewBox="0 0 200 160" width="200" height="160" fill="none">
          <rect x="30" y="55" width="140" height="88" rx="6" fill="#161b22" stroke="#30363d" strokeWidth="1.5"/>
          <rect x="30" y="44" width="70" height="18" rx="4" fill="#161b22" stroke="#30363d" strokeWidth="1.5"/>
          <rect x="42" y="70" width="116" height="7" rx="3.5" fill="#21262d"/>
          <rect x="42" y="84" width="86" height="7" rx="3.5" fill="#21262d"/>
          <rect x="42" y="98" width="100" height="7" rx="3.5" fill="#21262d"/>
          <rect x="42" y="112" width="70" height="7" rx="3.5" fill="#21262d"/>
          <rect x="138" y="108" width="20" height="20" rx="4" fill="#388bfd"/>
          <path d="M144 118l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="empty-title">Let's get started!</h2>
      <p className="empty-subtitle">
        Add a local SVN working copy to manage changes, view history, and commit.
      </p>
      <p className="empty-hint">
        Click <strong>Current repository</strong> in the toolbar, then press{' '}
        <kbd>+</kbd> to add a repository.
      </p>
    </div>
  )
}
