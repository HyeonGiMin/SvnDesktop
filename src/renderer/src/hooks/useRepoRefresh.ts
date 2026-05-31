import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { fetchStatus } from '../store/changesSlice'
import { fetchLog } from '../store/historySlice'
import { fetchSvnInfo } from '../store/repositoriesSlice'

export function useRepoRefresh(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  const repoPath = useSelector((s: RootState) => s.repositories.selected?.path ?? '')

  return useCallback(() => {
    if (!repoPath) return
    dispatch(fetchStatus(repoPath))
    dispatch(fetchLog({ repoPath }))
    dispatch(fetchSvnInfo(repoPath))
  }, [dispatch, repoPath])
}
