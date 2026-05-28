import React, { useState } from 'react'
import { RepoToolbar } from './components/Toolbar/RepoToolbar'
import { ChangesView } from './components/Changes/ChangesView'
import { HistoryView } from './components/History/HistoryView'
import { EmptyState } from './components/EmptyState/EmptyState'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import './App.css'

export type Tab = 'changes' | 'history'

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>('changes')
  const selected = useSelector((s: RootState) => s.repositories.selected)

  return (
    <div className="app">
      <RepoToolbar tab={tab} onTabChange={setTab} />
      <div className="app-content">
        {!selected ? (
          <EmptyState />
        ) : tab === 'changes' ? (
          <ChangesView />
        ) : (
          <HistoryView />
        )}
      </div>
    </div>
  )
}
