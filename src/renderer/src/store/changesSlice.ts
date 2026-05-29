import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { SvnFileStatus, SvnDiff } from '@shared/types'

interface ChangesState {
  files: SvnFileStatus[]
  checkedPaths: string[]
  commitMessage: string
  activeDiff: SvnDiff | null
  ignoreWhitespace: boolean
  loading: boolean
  committing: boolean
  error: string | null
}

const initialState: ChangesState = {
  files: [],
  checkedPaths: [],
  commitMessage: '',
  activeDiff: null,
  ignoreWhitespace: false,
  loading: false,
  committing: false,
  error: null,
}

export const fetchStatus = createAsyncThunk('changes/fetchStatus', (repoPath: string) =>
  window.api.svn.status(repoPath)
)

export const fetchDiff = createAsyncThunk(
  'changes/fetchDiff',
  ({ repoPath, filePath, status }: { repoPath: string; filePath: string; status?: string }, { getState }) => {
    if (status === 'unversioned') {
      return window.api.svn.readFile(filePath)
    }
    const state = getState() as { changes: ChangesState }
    return window.api.svn.diff(repoPath, filePath, state.changes.ignoreWhitespace)
  }
)

export const commitChanges = createAsyncThunk(
  'changes/commit',
  async (
    { repoPath, message, paths }: { repoPath: string; message: string; paths: string[] },
    { getState }
  ) => {
    const state = getState() as { changes: ChangesState }
    const unversioned = paths.filter(
      p => state.changes.files.find(f => f.path === p)?.status === 'unversioned'
    )
    if (unversioned.length > 0) {
      await window.api.svn.add(repoPath, unversioned)
    }
    return window.api.svn.commit(repoPath, message, paths)
  }
)

export const revertFiles = createAsyncThunk(
  'changes/revert',
  ({ repoPath, paths }: { repoPath: string; paths: string[] }) =>
    window.api.svn.revert(repoPath, paths)
)

const changesSlice = createSlice({
  name: 'changes',
  initialState,
  reducers: {
    setCheckedPaths(state, action: PayloadAction<string[]>) {
      state.checkedPaths = action.payload
    },
    togglePath(state, action: PayloadAction<string>) {
      const idx = state.checkedPaths.indexOf(action.payload)
      if (idx >= 0) {
        state.checkedPaths.splice(idx, 1)
      } else {
        state.checkedPaths.push(action.payload)
      }
    },
    setCommitMessage(state, action: PayloadAction<string>) {
      state.commitMessage = action.payload
    },
    setIgnoreWhitespace(state, action: PayloadAction<boolean>) {
      state.ignoreWhitespace = action.payload
    },
    clearDiff(state) {
      state.activeDiff = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStatus.fulfilled, (state, action) => {
        state.loading = false
        state.files = action.payload
        // auto-check all versioned files
        state.checkedPaths = action.payload
          .filter((f) => f.status !== 'ignored')
          .map((f) => f.path)
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to get status'
      })
      .addCase(fetchDiff.fulfilled, (state, action) => {
        state.activeDiff = action.payload
      })
      .addCase(fetchDiff.rejected, (state) => {
        state.activeDiff = null
      })
      .addCase(commitChanges.pending, (state) => {
        state.committing = true
        state.error = null
      })
      .addCase(commitChanges.fulfilled, (state) => {
        state.committing = false
        state.files = []
        state.checkedPaths = []
        state.commitMessage = ''
        state.activeDiff = null
      })
      .addCase(commitChanges.rejected, (state, action) => {
        state.committing = false
        state.error = action.error.message ?? 'Commit failed'
      })
      .addCase(revertFiles.fulfilled, (state, action) => {
        const reverted = new Set(action.meta.arg.paths)
        state.files = state.files.filter((f) => !reverted.has(f.path))
        state.checkedPaths = state.checkedPaths.filter((p) => !reverted.has(p))
      })
  },
})

export const { setCheckedPaths, togglePath, setCommitMessage, setIgnoreWhitespace, clearDiff } = changesSlice.actions
export default changesSlice.reducer
