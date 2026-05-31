'use client'

import { useState, useEffect } from 'react'
import { getTodayMotivation } from '@/lib/motivations'
import { X } from 'lucide-react'

export function DailyMotivationBanner() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const today = new Date().toDateString()
    const last = localStorage.getItem('lastMotivationShown')
    setMessage(getTodayMotivation())
    if (last !== today) {
      setVisible(true)
      localStorage.setItem('lastMotivationShown', today)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="mx-4 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 relative">
      <button
        onClick={() => setVisible(false)}
        className="absolute top-3 left-3 text-muted-foreground hover:text-foreground"
      >
        <X size={16} />
      </button>
      <div className="text-2xl mb-2 text-center">✨</div>
      <p className="text-sm text-center text-foreground leading-relaxed font-medium pr-2">{message}</p>
    </div>
  )
}
