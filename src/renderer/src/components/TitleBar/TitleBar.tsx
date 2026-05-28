import React, { useEffect, useState } from 'react'
import './TitleBar.css'

const MENU_ITEMS = ['File', 'Edit', 'View', 'Repository', 'Branch', 'Help'] as const

export function TitleBar(): JSX.Element {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    window.api.window.isMaximized().then(setMaximized)
    window.api.window.onMaximizeChange(setMaximized)
  }, [])

  function handleMenuClick(id: string, e: React.MouseEvent<HTMLButtonElement>): void {
    const rect = e.currentTarget.getBoundingClientRect()
    window.api.menu.popup(id.toLowerCase(), rect.left, rect.bottom)
  }

  return (
    <div className="titlebar">
      <div className="titlebar-app-icon" aria-hidden>
        <AppLogoIcon />
      </div>

      <div className="titlebar-menu">
        {MENU_ITEMS.map(item => (
          <button
            key={item}
            className="titlebar-menu-item"
            onClick={e => handleMenuClick(item, e)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="titlebar-drag" />

      <div className="titlebar-controls">
        <button
          className="titlebar-ctrl"
          title="Minimize"
          onClick={() => window.api.window.minimize()}
        >
          <MinimizeIcon />
        </button>
        <button
          className="titlebar-ctrl"
          title={maximized ? 'Restore' : 'Maximize'}
          onClick={() => window.api.window.maximize().then(() => setMaximized(m => !m))}
        >
          {maximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          className="titlebar-ctrl close"
          title="Close"
          onClick={() => window.api.window.close()}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

function AppLogoIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path fill="#f0883e" fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  )
}

function MinimizeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 10 1" width="10" height="1" aria-hidden>
      <path fill="currentColor" d="M0 0h10v1H0z" />
    </svg>
  )
}

function MaximizeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden>
      <path fill="currentColor" d="M0 0v10h10V0H0zm1 1h8v8H1V1z" />
    </svg>
  )
}

function RestoreIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden>
      <path fill="currentColor" d="M3 0v1H1v7h7V6h1V0H3zm1 1h4v4H7V2H4V1zm-2 2h3v1H2V3zm0 0v4h4V4H2V3z" />
    </svg>
  )
}

function CloseIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden>
      <path fill="currentColor" d="M.293.293l9.414 9.414-.707.707L-.414 1 .293.293zm9.414 0l.707.707L1 10.414l-.707-.707L9.707.293z" />
    </svg>
  )
}
