'use client'

import { useEffect, useState, useCallback } from 'react'
import { CigaretteLog } from '@/types'
import {
  subscribeToTodayLogs,
  logCigarette,
  deleteLastCigarette,
  updateChallengeScores,
  todayDate,
} from '@/lib/firestore'

export function useLogs(userId: string | undefined) {
  const [logs, setLogs] = useState<CigaretteLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLogs([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeToTodayLogs(userId, (l) => {
      setLogs(l.filter((x) => x.id !== '__optimistic__'))
      setLoading(false)
    })
    return unsub
  }, [userId])

  const log = useCallback(async () => {
    if (!userId) return
    const optimistic: CigaretteLog = {
      id: '__optimistic__',
      userId,
      timestamp: Date.now(),
      date: todayDate(),
    }
    setLogs((prev) => [optimistic, ...prev])
    await logCigarette(userId)
    updateChallengeScores(userId) // update challenge scores in background
  }, [userId])

  const undo = useCallback(async () => {
    if (!userId || logs.length === 0) return
    setLogs((prev) => prev.slice(1))
    await deleteLastCigarette(userId)
  }, [userId, logs])

  return { logs, count: logs.length, loading, log, undo }
}
