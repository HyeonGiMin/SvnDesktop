import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { SvnFileStatus, SvnDiff } from '@shared/types'
import { pushToast } from './uiSlice'

interface ChangesState {
  files: SvnFileStatus[]
  checkedPaths: string[]
  commitMessage: string
  activeDiff: SvnDiff | null
  ignoreWhitespace: boolean
  diffLoading: boolean
  loading: boolean
  committing: boolean
  error: string | null
  lastAutoCheckedRepo: string | null
}

const initialState: ChangesState = {
  files: [],
  checkedPaths: [],
  commitMessage: '',
  activeDiff: null,
  ignoreWhitespace: false,
  diffLoading: false,
  loading: false,
  committing: false,
  error: null,
  lastAutoCheckedRepo: null,
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
    { getState, dispatch }
  ) => {
    const state = getState() as { changes: ChangesState }
    const unversioned = paths.filter(
      p => state.changes.files.find(f => f.path === p)?.status === 'unversioned'
    )
    if (unversioned.length > 0) {
      await window.api.svn.add(repoPath, unversioned)
    }
    const revision = await window.api.svn.commit(repoPath, message, paths)
    dispatch(pushToast({ kind: 'success', message: `Committed revision r${revision}` }))
    return revision
  }
)

export const revertFiles = createAsyncThunk(
  'changes/revert',
  async ({ repoPath, paths }: { repoPath: string; paths: string[] }, { dispatch }) => {
    await window.api.svn.revert(repoPath, paths)
    dispatch(pushToast({ kind: 'success', message: `Reverted ${paths.length} file${paths.length !== 1 ? 's' : ''}` }))
  }
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
    addCheckedPaths(state, action: PayloadAction<string[]>) {
      const toAdd = action.payload.filter(p => !state.checkedPaths.includes(p))
      state.checkedPaths.push(...toAdd)
    },
    removeCheckedPaths(state, action: PayloadAction<string[]>) {
      const toRemove = new Set(action.payload)
      state.checkedPaths = state.checkedPaths.filter(p => !toRemove.has(p))
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
        const repoPath = action.meta.arg
        if (state.lastAutoCheckedRepo !== repoPath) {
          // New repo selected: auto-check everything except ignored
          state.lastAutoCheckedRepo = repoPath
          state.checkedPaths = action.payload
            .filter(f => f.status !== 'ignored')
            .map(f => f.path)
        } else {
          // Same repo refreshed: keep user's manual choices, remove gone files, add new files
          const existingPaths = new Set(action.payload.map(f => f.path))
          const prevPaths = new Set(state.files.map(f => f.path))
          state.checkedPaths = state.checkedPaths.filter(p => existingPaths.has(p))
          const newPaths = action.payload
            .filter(f => f.status !== 'ignored' && !prevPaths.has(f.path))
            .map(f => f.path)
          state.checkedPaths.push(...newPaths)
        }
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to get status'
      })
      .addCase(fetchDiff.pending, (state) => {
        state.diffLoading = true
      })
      .addCase(fetchDiff.fulfilled, (state, action) => {
        state.diffLoading = false
        state.activeDiff = action.payload
      })
      .addCase(fetchDiff.rejected, (state) => {
        state.diffLoading = false
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
        state.lastAutoCheckedRepo = null
      })
      .addCase(commitChanges.rejected, (state, action) => {
        state.committing = false
        state.error = action.error.message ?? 'Commit failed'
      })
      .addCase(revertFiles.rejected, (state, action) => {
        state.error = action.error.message ?? 'Revert failed'
      })
  },
})

export const {
  setCheckedPaths, togglePath, setCommitMessage,
  setIgnoreWhitespace, clearDiff,
  addCheckedPaths, removeCheckedPaths,
} = changesSlice.actions
export default changesSlice.reducer
