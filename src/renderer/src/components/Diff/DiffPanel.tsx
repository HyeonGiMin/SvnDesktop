import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { fetchRevisionDiff } from '../../store/historySlice'
import { fetchDiff, setIgnoreWhitespace } from '../../store/changesSlice'
import type { Tab } from '../../App'
import type { SvnDiff, DiffLine } from '@shared/types'
import './DiffPanel.css'

type DiffMode = 'unified' | 'split'

interface Props { tab: Tab }

export function DiffPanel({ tab }: Props): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const repoPath = useSelector((s: RootState) => s.repositories.selected?.path ?? '')
  const changesDiff = useSelector((s: RootState) => s.changes.activeDiff)
  const ignoreWhitespace = useSelector((s: RootState) => s.changes.ignoreWhitespace)
  const { selectedEntry, activeDiff: historyDiff } = useSelector((s: RootState) => s.history)

  const [mode, setMode] = useState<DiffMode>('unified')
  const [optionsOpen, setOptionsOpen] = useState(false)

  function handleIgnoreWhitespace(checked: boolean): void {
    dispatch(setIgnoreWhitespace(checked))
    const diff = tab === 'changes' ? changesDiff : historyDiff
    if (diff?.filePath && repoPath) {
      dispatch(fetchDiff({ repoPath, filePath: diff.filePath }))
    }
  }

  if (tab === 'changes') {
    if (!changesDiff) {
      return (
        <div className="diff-panel-empty">
          <p>Select a file to view the diff</p>
        </div>
      )
    }
    return (
      <div className="diff-panel">
        <DiffHeader
          path={changesDiff.filePath}
          mode={mode} onModeChange={setMode}
          ignoreWhitespace={ignoreWhitespace}
          onIgnoreWhitespace={handleIgnoreWhitespace}
          optionsOpen={optionsOpen}
          onToggleOptions={() => setOptionsOpen(v => !v)}
          onCloseOptions={() => setOptionsOpen(false)}
        />
        <DiffBody diff={changesDiff} mode={mode} />
      </div>
    )
  }

  if (!selectedEntry) {
    return (
      <div className="diff-panel-empty">
        <p>Select a commit to view its changes</p>
      </div>
    )
  }

  return (
    <div className="diff-panel">
      <div className="history-detail-header">
        <div className="history-detail-meta">
          <span className="history-detail-rev">r{selectedEntry.revision}</span>
          <span className="history-detail-author">{selectedEntry.author}</span>
        </div>
        <p className="history-detail-msg">{selectedEntry.message || '(no message)'}</p>
      </div>
      <div className="history-paths">
        {selectedEntry.paths.map((p, i) => (
          <div
            key={i}
            className="history-path-item"
            onClick={() => dispatch(fetchRevisionDiff({ repoPath, filePath: p.path }))}
          >
            <span className="history-path-action" data-action={p.action}>{p.action}</span>
            <span className="history-path-name">{p.path}</span>
          </div>
        ))}
      </div>
      {historyDiff && (
        <>
          <DiffHeader
            path={historyDiff.filePath}
            mode={mode} onModeChange={setMode}
            ignoreWhitespace={ignoreWhitespace}
            onIgnoreWhitespace={handleIgnoreWhitespace}
            optionsOpen={optionsOpen}
            onToggleOptions={() => setOptionsOpen(v => !v)}
            onCloseOptions={() => setOptionsOpen(false)}
          />
          <DiffBody diff={historyDiff} mode={mode} />
        </>
      )}
    </div>
  )
}

/* ── Header with DiffOptions popover ───────────────────────────────────── */

interface DiffHeaderProps {
  path: string
  mode: DiffMode
  onModeChange: (m: DiffMode) => void
  ignoreWhitespace: boolean
  onIgnoreWhitespace: (v: boolean) => void
  optionsOpen: boolean
  onToggleOptions: () => void
  onCloseOptions: () => void
}

function DiffHeader({
  path, mode, onModeChange,
  ignoreWhitespace, onIgnoreWhitespace,
  optionsOpen, onToggleOptions, onCloseOptions,
}: DiffHeaderProps): JSX.Element {
  const gearRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!optionsOpen) return
    function handler(e: MouseEvent): void {
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) {
        onCloseOptions()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [optionsOpen, onCloseOptions])

  return (
    <div className="diff-file-header">
      <span className="diff-file-path">{path.replace(/\//g, '\\')}</span>
      <div className="diff-header-actions">
        <div className="diff-options-wrap" ref={gearRef}>
          <button
            className={`diff-header-btn ${optionsOpen ? 'active' : ''}`}
            onClick={onToggleOptions}
            title="Diff options"
          >
            <GearIcon />
          </button>
          {optionsOpen && (
            <div className="diff-options-popover">
              <label className="diff-options-checkbox-row">
                <input
                  type="checkbox"
                  checked={ignoreWhitespace}
                  onChange={e => onIgnoreWhitespace(e.target.checked)}
                />
                <span>Hide whitespace changes</span>
              </label>
              <div className="diff-options-divider" />
              <div className="diff-options-section-label">Diff display</div>
              <label className="diff-options-radio-row">
                <input
                  type="radio"
                  name="diff-mode"
                  checked={mode === 'unified'}
                  onChange={() => onModeChange('unified')}
                />
                <span>Unified</span>
              </label>
              <label className="diff-options-radio-row">
                <input
                  type="radio"
                  name="diff-mode"
                  checked={mode === 'split'}
                  onChange={() => onModeChange('split')}
                />
                <span>Split</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Body ───────────────────────────────────────────────────────────────── */

function DiffBody({ diff, mode }: { diff: SvnDiff; mode: DiffMode }): JSX.Element {
  if (diff.isPlainView) {
    return diff.hunks[0]?.lines.length
      ? <PlainContent lines={diff.hunks[0].lines} />
      : <div className="diff-no-changes">Empty file</div>
  }
  if (!diff || diff.hunks.length === 0) {
    return <div className="diff-no-changes">No textual changes</div>
  }
  return mode === 'split'
    ? <SplitDiffContent diff={diff} />
    : <UnifiedDiffContent diff={diff} />
}

/* ── Plain view (unversioned files) ─────────────────────────────────────── */

function PlainContent({ lines }: { lines: DiffLine[] }): JSX.Element {
  return (
    <div className="diff-plain-content">
      {lines.map((line, i) => (
        <div key={i} className="diff-plain-line">
          <span className="diff-gutter">{line.newLineNo ?? i + 1}</span>
          <span className="diff-plain-code">{line.content}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Unified view ───────────────────────────────────────────────────────── */

function UnifiedDiffContent({ diff }: { diff: SvnDiff }): JSX.Element {
  return (
    <div className="diff-content">
      {diff.hunks.map((hunk, hi) => (
        <div key={hi} className="diff-hunk">
          <div className="diff-hunk-header">{hunk.header}</div>
          {hunk.lines.map((line, li) => (
            <div key={li} className={`diff-line diff-line--${line.type}`}>
              <span className="diff-gutter-check">
                {line.type !== 'context' && <CheckMark />}
              </span>
              <span className="diff-gutter old">{line.oldLineNo ?? ''}</span>
              <span className="diff-gutter new">{line.newLineNo ?? ''}</span>
              <span className="diff-sign">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <span className="diff-code">{line.content}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── Split view ─────────────────────────────────────────────────────────── */

type SplitRow =
  | { kind: 'context'; line: DiffLine }
  | { kind: 'change'; left: DiffLine | null; right: DiffLine | null }

function buildSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.type === 'context') {
      rows.push({ kind: 'context', line })
      i++
    } else {
      const removed: DiffLine[] = []
      const added: DiffLine[] = []
      while (i < lines.length && lines[i].type === 'removed') removed.push(lines[i++])
      while (i < lines.length && lines[i].type === 'added') added.push(lines[i++])
      const len = Math.max(removed.length, added.length)
      for (let j = 0; j < len; j++) {
        rows.push({ kind: 'change', left: removed[j] ?? null, right: added[j] ?? null })
      }
    }
  }
  return rows
}

function SplitDiffContent({ diff }: { diff: SvnDiff }): JSX.Element {
  return (
    <div className="diff-split-content">
      {diff.hunks.map((hunk, hi) => (
        <div key={hi} className="diff-hunk">
          <div className="diff-split-hunk-header">
            <span className="diff-split-hunk-text">{hunk.header}</span>
          </div>
          {buildSplitRows(hunk.lines).map((row, ri) => {
            if (row.kind === 'context') {
              return (
                <div key={ri} className="diff-split-row">
                  <SplitCell line={row.line} side="left" />
                  <div className="diff-split-divider" />
                  <SplitCell line={row.line} side="right" />
                </div>
              )
            }
            return (
              <div key={ri} className="diff-split-row">
                <SplitCell line={row.left} side="left" />
                <div className="diff-split-divider" />
                <SplitCell line={row.right} side="right" />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function SplitCell({ line, side }: { line: DiffLine | null; side: 'left' | 'right' }): JSX.Element {
  if (!line) {
    return <div className="diff-split-cell diff-split-cell--empty" />
  }
  const cls =
    line.type === 'removed' ? 'diff-line--removed' :
    line.type === 'added'   ? 'diff-line--added' : ''
  const lineNo = side === 'left' ? line.oldLineNo : line.newLineNo
  return (
    <div className={`diff-split-cell ${cls}`}>
      <span className="diff-gutter">{lineNo ?? ''}</span>
      <span className="diff-sign">
        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
      </span>
      <span className="diff-code">{line.content}</span>
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────────── */

function GearIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path fill="currentColor" d="M8 0a8.2 8.2 0 01.701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.255.006.07.014.141.014.215 0 .074-.008.145-.014.215-.01.108.04.207.088.255l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 01-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 01-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 01-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 01-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 01-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.255A6.466 6.466 0 012 8a6.4 6.4 0 01-.014-.215c.01-.108-.038-.207-.088-.255l-.815-.806C.632 6.108.428 5.361.743 4.686c.198-.426.434-.833.704-1.218.428-.609 1.176-.806 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.011.645 6.557.095 7.3.03 7.534.01 7.768 0 8 0zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 000 1.582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 001.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.412-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 000-1.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 00-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 00-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 00-1.142 0zM8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 1.5a2 2 0 110 4 2 2 0 010-4z" />
    </svg>
  )
}

function CheckMark(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden>
      <path fill="currentColor" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
    </svg>
  )
}
