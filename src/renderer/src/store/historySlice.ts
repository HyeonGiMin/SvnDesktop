import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { SvnLogEntry, SvnDiff } from '@shared/types'

interface HistoryState {
  entries: SvnLogEntry[]
  selectedEntry: SvnLogEntry | null
  activeDiff: SvnDiff | null
  diffLoading: boolean
  loading: boolean
  error: string | null
}

const initialState: HistoryState = {
  entries: [],
  selectedEntry: null,
  activeDiff: null,
  diffLoading: false,
  loading: false,
  error: null,
}

export const fetchLog = createAsyncThunk(
  'history/fetchLog',
  ({ repoPath, limit }: { repoPath: string; limit?: number }) =>
    window.api.svn.log(repoPath, limit)
)

export const fetchRevisionDiff = createAsyncThunk(
  'history/fetchDiff',
  ({ repoPath, filePath }: { repoPath: string; filePath: string }, { getState }) => {
    const state = getState() as { changes: { ignoreWhitespace: boolean } }
    return window.api.svn.diff(repoPath, filePath, state.changes.ignoreWhitespace)
  }
)

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    selectEntry(state, action: PayloadAction<SvnLogEntry | null>) {
      state.selectedEntry = action.payload
      state.activeDiff = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLog.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLog.fulfilled, (state, action) => {
        state.loading = false
        state.entries = action.payload
      })
      .addCase(fetchLog.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load log'
      })
      .addCase(fetchRevisionDiff.pending, (state) => {
        state.diffLoading = true
      })
      .addCase(fetchRevisionDiff.fulfilled, (state, action) => {
        state.diffLoading = false
        state.activeDiff = action.payload
      })
      .addCase(fetchRevisionDiff.rejected, (state) => {
        state.diffLoading = false
        state.activeDiff = null
      })
  },
})

export const { selectEntry } = historySlice.actions
export default historySlice.reducer
