import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Repository } from '@shared/types'

interface RepositoriesState {
  list: Repository[]
  selected: Repository | null
  loading: boolean
  error: string | null
}

const initialState: RepositoriesState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
}

export const fetchRepositories = createAsyncThunk('repositories/fetchAll', () =>
  window.api.repos.list()
)

export const addRepository = createAsyncThunk(
  'repositories/add',
  ({ name, path }: { name: string; path: string }) => window.api.repos.add(name, path)
)

export const removeRepository = createAsyncThunk('repositories/remove', async (id: string) => {
  await window.api.repos.remove(id)
  return id
})

const repositoriesSlice = createSlice({
  name: 'repositories',
  initialState,
  reducers: {
    selectRepository(state, action: PayloadAction<Repository | null>) {
      state.selected = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepositories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRepositories.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchRepositories.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load repositories'
      })
      .addCase(addRepository.fulfilled, (state, action) => {
        const exists = state.list.find((r) => r.id === action.payload.id)
        if (!exists) state.list.push(action.payload)
        state.selected = action.payload
      })
      .addCase(removeRepository.fulfilled, (state, action) => {
        state.list = state.list.filter((r) => r.id !== action.payload)
        if (state.selected?.id === action.payload) state.selected = null
      })
  },
})

export const { selectRepository } = repositoriesSlice.actions
export default repositoriesSlice.reducer
