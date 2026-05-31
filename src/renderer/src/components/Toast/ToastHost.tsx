import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { dismissToast } from '../../store/uiSlice'
import './ToastHost.css'

const TTL_MS: Record<string, number> = { error: 8000, success: 3500, info: 5000 }

export function ToastHost(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>()
  const toasts = useSelector((s: RootState) => s.ui.toasts)

  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dispatch(dismissToast(toast.id))}
        />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: import('../../store/uiSlice').Toast
  onDismiss: () => void
}): JSX.Element {
  useEffect(() => {
    if (toast.sticky) return
    const ttl = TTL_MS[toast.kind] ?? 5000
    const id = setTimeout(onDismiss, ttl)
    return () => clearTimeout(id)
  }, [toast.id, toast.kind, toast.sticky, onDismiss])

  return (
    <div className={`toast toast--${toast.kind}`} role="alert">
      <span className="toast-icon">
        {toast.kind === 'error' ? <ErrorIcon /> : toast.kind === 'success' ? <CheckIcon /> : <InfoIcon />}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-dismiss" onClick={onDismiss} title="Dismiss">
        <CloseIcon />
      </button>
    </div>
  )
}

function ErrorIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path fill="currentColor" d="M2.343 13.657A8 8 0 1113.657 2.343 8 8 0 012.343 13.657zM6.03 4.97a.75.75 0 00-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 101.06 1.06L8 9.06l1.97 1.97a.75.75 0 101.06-1.06L9.06 8l1.97-1.97a.75.75 0 10-1.06-1.06L8 6.94 6.03 4.97z" />
    </svg>
  )
}

function CheckIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path fill="currentColor" d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.5-4.5z" />
    </svg>
  )
}

function InfoIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path fill="currentColor" d="M8 16A8 8 0 108 0a8 8 0 000 16zm0-11a1 1 0 110-2 1 1 0 010 2zm-1 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5z" />
    </svg>
  )
}

function CloseIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path fill="currentColor" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.749.749 0 111.06 1.06L9.06 8l3.22 3.22a.749.749 0 11-1.06 1.06L8 9.06l-3.22 3.22a.749.749 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
    </svg>
  )
}
