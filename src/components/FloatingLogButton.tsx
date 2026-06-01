'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'smokeless_floating_btn_hidden'
const POS_KEY = 'smokeless_floating_btn_pos'

interface Props {
  onLog: () => void
  overLimit: boolean
}

export function FloatingLogButton({ onLog, overLimit }: Props) {
  const [hidden, setHidden] = useState(true)
  const [tapped, setTapped] = useState(false)
  const [pos, setPos] = useState({ x: 16, y: 120 }) // distance from bottom-right
  const dragging = useRef(false)
  const startTouch = useRef({ x: 0, y: 0, px: 0, py: 0 })

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) !== 'true')
    const saved = localStorage.getItem(POS_KEY)
    if (saved) setPos(JSON.parse(saved))
  }, [])

  function dismiss() {
    localStorage.removeItem(STORAGE_KEY)
    setHidden(true)
  }

  function handleTouchStart(e: React.TouchEvent) {
    dragging.current = false
    const t = e.touches[0]
    startTouch.current = { x: t.clientX, y: t.clientY, px: pos.x, py: pos.y }
  }

  function handleTouchMove(e: React.TouchEvent) {
    const t = e.touches[0]
    const dx = t.clientX - startTouch.current.x
    const dy = t.clientY - startTouch.current.y
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragging.current = true
    if (!dragging.current) return
    e.preventDefault()
    // pos = distance from bottom-right corner
    const newX = Math.max(8, Math.min(window.innerWidth - 64, startTouch.current.px - dx))
    const newY = Math.max(80, Math.min(window.innerHeight - 140, startTouch.current.py - dy))
    setPos({ x: newX, y: newY })
  }

  function handleTouchEnd() {
    if (!dragging.current) {
      // it was a tap
      setTapped(true)
      setTimeout(() => setTapped(false), 200)
      onLog()
    }
    localStorage.setItem(POS_KEY, JSON.stringify(pos))
    dragging.current = false
  }

  if (hidden) return null

  return (
    <div
      className="fixed z-50"
      style={{ bottom: pos.y, right: pos.x }}
    >
      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="absolute -top-2 -left-2 w-5 h-5 bg-card border border-border rounded-full flex items-center justify-center z-10 shadow"
      >
        <X size={9} className="text-muted-foreground" />
      </button>

      {/* Main button */}
      <button
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (!dragging.current) { setTapped(true); setTimeout(() => setTapped(false), 200); onLog() } }}
        className={cn(
          'w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-2xl select-none',
          'transition-transform duration-100',
          tapped ? 'scale-90' : 'scale-100',
          overLimit ? 'bg-red-500 shadow-red-500/50' : 'bg-amber-400 shadow-amber-400/50'
        )}
        style={{ touchAction: 'none' }}
        aria-label="הוסף סיגריה"
      >
        🚬
      </button>

      {/* Drag hint */}
      <p className="text-center text-[9px] text-muted-foreground mt-1 select-none">גרור</p>
    </div>
  )
}
