'use client'

import { useEffect } from 'react'

const LAST_LOG_KEY = 'smokeless_last_log_time'
const LAST_REMINDER_KEY = 'smokeless_last_reminder_time'
const ONE_HOUR = 60 * 60 * 1000
const CHECK_INTERVAL = 5 * 60 * 1000 // check every 5 min

export function useReminder(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    function check() {
      const now = new Date()
      const hour = now.getHours()
      // Only between 10:00 and 22:00
      if (hour < 10 || hour >= 22) return

      const lastReminder = localStorage.getItem(LAST_REMINDER_KEY)
      // Don't show more than once per hour
      if (lastReminder && Date.now() - Number(lastReminder) < ONE_HOUR) return

      const lastLog = localStorage.getItem(LAST_LOG_KEY)
      const timeSinceLog = lastLog ? Date.now() - Number(lastLog) : ONE_HOUR + 1

      if (timeSinceLog >= ONE_HOUR) {
        new Notification('Smokeless 🚬', {
          body: 'עברה שעה — שכחת לעדכן סיגריות?',
          icon: '/icon-192.png',
        })
        localStorage.setItem(LAST_REMINDER_KEY, String(Date.now()))
      }
    }

    check() // immediate check on mount
    const interval = setInterval(check, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [enabled])
}
