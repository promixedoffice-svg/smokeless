'use client'

import { useEffect, useState, useCallback } from 'react'
import { CigaretteLog } from '@/types'
import {
  subscribeToTodayLogs,
  logCigarette,
  deleteLastCigarette,
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
      setLogs(l)
      setLoading(false)
    })
    return unsub
  }, [userId])

  const log = useCallback(async () => {
    if (!userId) return
    await logCigarette(userId)
  }, [userId])

  const undo = useCallback(async () => {
    if (!userId || logs.length === 0) return
    await deleteLastCigarette(userId)
  }, [userId, logs])

  return { logs, count: logs.length, loading, log, undo }
}
