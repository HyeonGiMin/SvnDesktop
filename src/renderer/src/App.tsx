import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar/Sidebar'
import { ChangesView } from './components/Changes/ChangesView'
import { HistoryView } from './components/History/HistoryView'
import './App.css'

type Tab = 'changes' | 'history'

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>('changes')

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === 'changes' ? 'active' : ''}`}
            onClick={() => setTab('changes')}
          >
            Changes
          </button>
          <button
            className={`tab-btn ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >
            History
          </button>
        </div>
        <div className="tab-content">
          {tab === 'changes' ? <ChangesView /> : <HistoryView />}
        </div>
      </div>
    </div>
  )
}
