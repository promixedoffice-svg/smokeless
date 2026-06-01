'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'smokeless_floating_btn_hidden'

interface Props {
  onLog: () => void
  overLimit: boolean
}

export function FloatingLogButton({ onLog, overLimit }: Props) {
  const [hidden, setHidden] = useState(true)
  const [tapped, setTapped] = useState(false)

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setHidden(true)
  }

  async function handleTap() {
    setTapped(true)
    setTimeout(() => setTapped(false), 200)
    onLog()
  }

  if (hidden) return null

  return (
    <div className="fixed bottom-24 left-4 z-40 flex flex-col items-center gap-1">
      {/* Dismiss button */}
      <button
        onClick={dismiss}
        className="w-5 h-5 bg-muted border border-border rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity mb-0.5"
        aria-label="הסתר"
      >
        <X size={10} />
      </button>

      {/* Main floating button */}
      <button
        onClick={handleTap}
        className={cn(
          'w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl',
          'transition-all duration-150 select-none active:scale-90',
          tapped ? 'scale-90 brightness-90' : 'scale-100',
          overLimit
            ? 'bg-red-500 shadow-red-500/40'
            : 'bg-amber-400 shadow-amber-400/40'
        )}
        aria-label="הוסף סיגריה"
      >
        🚬
      </button>
    </div>
  )
}
