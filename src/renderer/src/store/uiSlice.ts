import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Toast {
  id: string
  kind: 'error' | 'success' | 'info'
  message: string
  sticky?: boolean
}

interface UiState {
  toasts: Toast[]
}

const initialState: UiState = { toasts: [] }

let _nextId = 0

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    pushToast(state, action: PayloadAction<Omit<Toast, 'id'> & { id?: string }>) {
      const { id = String(++_nextId), ...rest } = action.payload
      state.toasts.push({ id, ...rest })
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload)
    },
  },
})

export const { pushToast, dismissToast } = uiSlice.actions
export default uiSlice.reducer
