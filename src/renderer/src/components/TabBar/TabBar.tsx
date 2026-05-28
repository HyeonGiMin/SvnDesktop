import React from 'react'
import type { Tab } from '../../App'
import './TabBar.css'

interface Props {
  tab: Tab
  onTabChange: (t: Tab) => void
  changesCount: number
}

export function TabBar({ tab, onTabChange, changesCount }: Props): JSX.Element {
  return (
    <div className="tab-bar">
      <button
        className={`tab-item ${tab === 'changes' ? 'active' : ''}`}
        onClick={() => onTabChange('changes')}
      >
        Changes
        {changesCount > 0 && (
          <span className="tab-badge">{changesCount}</span>
        )}
      </button>
      <button
        className={`tab-item ${tab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
      >
        History
      </button>
    </div>
  )
}
