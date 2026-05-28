import { exec } from 'child_process'
import { promisify } from 'util'
import { SvnFileStatus, SvnLogEntry, SvnDiff, SvnInfo, DiffHunk, DiffLine } from '../../shared/types'

const execAsync = promisify(exec)

async function run(args: string, cwd: string): Promise<string> {
  const { stdout } = await execAsync(`svn ${args}`, { cwd, windowsHide: true })
  return stdout
}

export async function getStatus(repoPath: string): Promise<SvnFileStatus[]> {
  const output = await run('status --xml', repoPath)
  return parseStatusXml(output, repoPath)
}

export async function commit(
  repoPath: string,
  message: string,
  paths: string[]
): Promise<number> {
  const escaped = paths.map((p) => `"${p}"`).join(' ')
  const output = await run(`commit -m "${message.replace(/"/g, '\\"')}" ${escaped}`, repoPath)
  const match = output.match(/Committed revision (\d+)/)
  return match ? parseInt(match[1], 10) : -1
}

export async function getLog(repoPath: string, limit = 50): Promise<SvnLogEntry[]> {
  const output = await run(`log --xml -l ${limit} -v`, repoPath)
  return parseLogXml(output)
}

export async function getDiff(repoPath: string, filePath: string): Promise<SvnDiff> {
  const output = await run(`diff "${filePath}"`, repoPath)
  return parseDiff(filePath, output)
}

export async function getInfo(repoPath: string): Promise<SvnInfo> {
  const output = await run('info --xml', repoPath)
  return parseInfoXml(output)
}

export async function update(repoPath: string): Promise<string> {
  return run('update', repoPath)
}

export async function revert(repoPath: string, paths: string[]): Promise<void> {
  const escaped = paths.map((p) => `"${p}"`).join(' ')
  await run(`revert ${escaped}`, repoPath)
}

export async function addUnversioned(repoPath: string, paths: string[]): Promise<void> {
  const escaped = paths.map((p) => `"${p}"`).join(' ')
  await run(`add ${escaped}`, repoPath)
}

// ── XML parsers ──────────────────────────────────────────────────────────────

function parseInfoXml(xml: string): SvnInfo {
  const url = extractTag(xml, 'url') || ''
  const revMatch = xml.match(/revision="(\d+)"/)
  const revision = revMatch ? parseInt(revMatch[1], 10) : 0
  const author = extractTag(xml, 'author') || ''
  const lastChangedDate = extractTag(xml, 'date') || ''
  return { url, revision, author, lastChangedDate }
}

function parseStatusXml(xml: string, repoPath: string): SvnFileStatus[] {
  const results: SvnFileStatus[] = []
  const entryRegex = /<entry\s+path="([^"]+)"[\s\S]*?<wc-status\s+item="([^"]+)"/g
  let match: RegExpExecArray | null
  while ((match = entryRegex.exec(xml)) !== null) {
    const fullPath = match[1]
    const item = match[2]
    const status = mapStatusItem(item)
    if (status) {
      const relativePath = fullPath.startsWith(repoPath)
        ? fullPath.slice(repoPath.length).replace(/^[\\/]/, '')
        : fullPath
      results.push({ path: fullPath, relativePath, status })
    }
  }
  return results
}

function mapStatusItem(item: string): SvnFileStatus['status'] | null {
  const map: Record<string, SvnFileStatus['status']> = {
    modified: 'modified',
    added: 'added',
    deleted: 'deleted',
    conflicted: 'conflicted',
    unversioned: 'unversioned',
    missing: 'missing',
    replaced: 'replaced',
    ignored: 'ignored',
  }
  return map[item] ?? null
}

function parseLogXml(xml: string): SvnLogEntry[] {
  const entries: SvnLogEntry[] = []
  const logEntryRegex = /<logentry\s+revision="(\d+)">([\s\S]*?)<\/logentry>/g
  let match: RegExpExecArray | null
  while ((match = logEntryRegex.exec(xml)) !== null) {
    const revision = parseInt(match[1], 10)
    const body = match[2]
    const author = extractTag(body, 'author')
    const date = extractTag(body, 'date')
    const message = extractTag(body, 'msg')
    const paths = parsePaths(body)
    entries.push({ revision, author, date, message, paths })
  }
  return entries
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return match ? match[1].trim() : ''
}

function parsePaths(body: string): SvnLogEntry['paths'] {
  const paths: SvnLogEntry['paths'] = []
  const pathRegex = /<path\s+[^>]*action="([^"]+)"[^>]*>([^<]+)<\/path>/g
  let match: RegExpExecArray | null
  while ((match = pathRegex.exec(body)) !== null) {
    const action = match[1] as 'M' | 'A' | 'D' | 'R'
    paths.push({ path: match[2].trim(), action })
  }
  return paths
}

// ── Unified diff parser ───────────────────────────────────────────────────────

function parseDiff(filePath: string, raw: string): SvnDiff {
  const hunks: DiffHunk[] = []
  const hunkHeaderRe = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/
  let currentHunk: DiffHunk | null = null
  let oldLine = 0
  let newLine = 0

  for (const line of raw.split('\n')) {
    const hunkMatch = line.match(hunkHeaderRe)
    if (hunkMatch) {
      currentHunk = { header: line, lines: [] }
      hunks.push(currentHunk)
      oldLine = parseInt(hunkMatch[1], 10)
      newLine = parseInt(hunkMatch[2], 10)
      continue
    }
    if (!currentHunk) continue

    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentHunk.lines.push({ type: 'added', content: line.slice(1), newLineNo: newLine++ })
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      currentHunk.lines.push({ type: 'removed', content: line.slice(1), oldLineNo: oldLine++ })
    } else if (line.startsWith(' ')) {
      currentHunk.lines.push({
        type: 'context',
        content: line.slice(1),
        oldLineNo: oldLine++,
        newLineNo: newLine++,
      })
    }
  }

  return { filePath, hunks }
}
