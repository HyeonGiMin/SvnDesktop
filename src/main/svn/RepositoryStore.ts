import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { Repository } from '../../shared/types'

const storePath = join(app.getPath('userData'), 'repositories.json')

export function loadRepositories(): Repository[] {
  if (!existsSync(storePath)) return []
  try {
    return JSON.parse(readFileSync(storePath, 'utf-8'))
  } catch {
    return []
  }
}

export function saveRepositories(repos: Repository[]): void {
  mkdirSync(join(storePath, '..'), { recursive: true })
  writeFileSync(storePath, JSON.stringify(repos, null, 2), 'utf-8')
}
