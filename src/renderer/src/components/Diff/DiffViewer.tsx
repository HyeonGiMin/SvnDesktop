import React from 'react'
import { SvnDiff } from '@shared/types'
import './DiffViewer.css'

interface Props {
  diff: SvnDiff
}

export function DiffViewer({ diff }: Props): JSX.Element {
  if (diff.hunks.length === 0) {
    return <div className="diff-no-changes">No differences</div>
  }

  return (
    <div className="diff-viewer">
      <div className="diff-file-header">{diff.filePath}</div>
      <div className="diff-content">
        {diff.hunks.map((hunk, hi) => (
          <div key={hi} className="diff-hunk">
            <div className="diff-hunk-header">{hunk.header}</div>
            {hunk.lines.map((line, li) => (
              <div key={li} className={`diff-line diff-line--${line.type}`}>
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
    </div>
  )
}
