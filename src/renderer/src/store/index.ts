import { configureStore } from '@reduxjs/toolkit'
import repositoriesReducer from './repositoriesSlice'
import changesReducer from './changesSlice'
import historyReducer from './historySlice'

export const store = configureStore({
  reducer: {
    repositories: repositoriesReducer,
    changes: changesReducer,
    history: historyReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
