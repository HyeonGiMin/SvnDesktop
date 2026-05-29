import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { Repository } from '../../shared/types'

const storePath = join(app.getPath('userData'), 'repositories.json')

interface Store {
  repos: Repository[]
  lastSelectedId: string | null
}

function loadStore(): Store {
  if (!existsSync(storePath)) return { repos: [], lastSelectedId: null }
  try {
    const parsed = JSON.parse(readFileSync(storePath, 'utf-8'))
    if (Array.isArray(parsed)) return { repos: parsed, lastSelectedId: null }
    return parsed
  } catch {
    return { repos: [], lastSelectedId: null }
  }
}

function saveStore(store: Store): void {
  mkdirSync(join(storePath, '..'), { recursive: true })
  writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8')
}

export function loadRepositories(): Repository[] {
  return loadStore().repos
}

export function saveRepositories(repos: Repository[]): void {
  saveStore({ ...loadStore(), repos })
}

export function loadLastSelectedId(): string | null {
  return loadStore().lastSelectedId
}

export function saveLastSelectedId(id: string | null): void {
  saveStore({ ...loadStore(), lastSelectedId: id })
}
