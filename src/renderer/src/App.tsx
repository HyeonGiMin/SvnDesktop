import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import { Toolbar } from './components/Toolbar/Toolbar'
import { TabBar } from './components/TabBar/TabBar'
import { ChangesSidebar } from './components/Changes/ChangesSidebar'
import { HistorySidebar } from './components/History/HistorySidebar'
import { DiffPanel } from './components/Diff/DiffPanel'
import { EmptyState } from './components/EmptyState/EmptyState'
import './App.css'

export type Tab = 'changes' | 'history'

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>('changes')
  const selected = useSelector((s: RootState) => s.repositories.selected)
  const changesCount = useSelector(
    (s: RootState) =>
      s.changes.files.filter(f => f.status !== 'unversioned' && f.status !== 'ignored').length
  )

  return (
    <div className="app">
      <Toolbar />

      {selected ? (
        <div className="app-body">
          {/* LEFT: tab bar + sidebar */}
          <div className="left-panel">
            <TabBar tab={tab} onTabChange={setTab} changesCount={changesCount} />
            <div className="left-content">
              {tab === 'changes' ? <ChangesSidebar /> : <HistorySidebar />}
            </div>
          </div>

          {/* RIGHT: diff / detail panel */}
          <div className="right-panel">
            <DiffPanel tab={tab} />
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
