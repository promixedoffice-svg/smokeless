'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Users, Trophy, TrendingUp, Calendar, Trash2, RefreshCw, Copy, Check, LogOut, Cigarette, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID

interface AdminUser {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  joinedAt: string
  dailyGoal?: number
  cigaretteBrand?: string
  streak?: number
  currency?: string
  age?: number
}

interface Stats {
  totalUsers: number
  newThisWeek: number
  totalChallenges: number
  activeChallenges: number
  logsToday: number
  users: AdminUser[]
}

export default function AdminPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [search, setSearch] = useState('')
  const [deletingUid, setDeletingUid] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = ADMIN_UID && user?.uid === ADMIN_UID
  const isSetupMode = !ADMIN_UID // env var not set yet

  const fetchStats = useCallback(async () => {
    if (!user || !isAdmin) return
    setLoadingStats(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callerUid: user.uid }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStats(data)
    } catch (e) {
      setError(String(e))
    }
    setLoadingStats(false)
  }, [user, isAdmin])

  useEffect(() => {
    if (!loading && !user) router.push('/')
    if (!loading && user && isAdmin) fetchStats()
  }, [loading, user, isAdmin, fetchStats, router])

  async function handleDelete(targetUid: string) {
    if (!user) return
    setDeletingUid(targetUid)
    setConfirmDelete(null)
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid, callerUid: user.uid }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await fetchStats()
    } catch (e) {
      setError(String(e))
    }
    setDeletingUid(null)
  }

  function copyUid() {
    if (!user) return
    navigator.clipboard.writeText(user.uid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-4xl animate-pulse">🔐</div>
    </div>
  )

  if (!user) return null

  // Setup mode — ADMIN_UID env var not set
  if (isSetupMode) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir="rtl">
      <div className="bg-card rounded-3xl p-6 max-w-sm w-full border border-amber-400/30">
        <div className="text-4xl mb-4 text-center">⚙️</div>
        <h1 className="text-lg font-bold text-center mb-2">הגדרת Admin</h1>
        <p className="text-sm text-muted-foreground text-center mb-5">
          כדי להפעיל את לוח הניהול, הוסף את ה-UID שלך ל-Vercel
        </p>
        <div className="bg-background rounded-xl p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">ה-UID שלך:</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-amber-400 flex-1 break-all">{user.uid}</code>
            <button onClick={copyUid} className="flex-shrink-0">
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-muted-foreground" />}
            </button>
          </div>
        </div>
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-amber-400">הוראות:</p>
          <p>1. העתק את ה-UID למעלה</p>
          <p>2. פתח Vercel → Settings → Environment Variables</p>
          <p>3. הוסף: <code className="text-amber-400">NEXT_PUBLIC_ADMIN_UID</code> = UID שלך</p>
          <p>4. Redeploy</p>
        </div>
      </div>
    </div>
  )

  // Access denied
  if (!isAdmin) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🚫</div>
        <p className="text-lg font-bold">אין גישה</p>
        <button onClick={() => router.push('/')} className="mt-4 text-sm text-muted-foreground underline">חזור הביתה</button>
      </div>
    </div>
  )

  const filtered = (stats?.users ?? []).filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (iso: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-background pb-12" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">🔐 Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Smokeless · {user.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStats} disabled={loadingStats}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center active:scale-95">
            <RefreshCw size={16} className={cn(loadingStats && 'animate-spin')} />
          </button>
          <button onClick={logout}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center active:scale-95 text-red-400">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        {[
          { label: 'סה"כ משתמשים', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-amber-400' },
          { label: 'חדשים השבוע', value: stats?.newThisWeek ?? '—', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'תחרויות פעילות', value: stats?.activeChallenges ?? '—', icon: Trophy, color: 'text-blue-400' },
          { label: 'לוגים היום', value: stats?.logsToday ?? '—', icon: Cigarette, color: 'text-rose-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={color} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className={cn('text-3xl font-black', color)}>{loadingStats ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* User List */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">משתמשים ({filtered.length})</h2>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute top-3 right-3 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם / אימייל..."
            className="w-full bg-card border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>

        {loadingStats ? (
          <div className="text-center py-12 text-muted-foreground text-sm">טוען נתונים...</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.uid} className="bg-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                        {u.displayName?.[0] ?? '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{u.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Delete */}
                  {confirmDelete === u.uid ? (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => setConfirmDelete(null)}
                        className="h-8 px-2.5 rounded-lg bg-muted text-xs active:scale-95">ביטול</button>
                      <button onClick={() => handleDelete(u.uid)} disabled={deletingUid === u.uid}
                        className="h-8 px-2.5 rounded-lg bg-red-500 text-white text-xs active:scale-95 disabled:opacity-60">
                        {deletingUid === u.uid ? '...' : 'מחק'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(u.uid)}
                      className="flex-shrink-0 w-8 h-8 rounded-xl border border-red-500/30 text-red-400 flex items-center justify-center active:scale-95">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(u.joinedAt)}
                  </span>
                  {u.dailyGoal && (
                    <span className="text-xs text-muted-foreground">יעד: {u.dailyGoal}/יום</span>
                  )}
                  {u.cigaretteBrand && (
                    <span className="text-xs text-muted-foreground">🚬 {u.cigaretteBrand}</span>
                  )}
                  {u.streak ? (
                    <span className="text-xs text-amber-400">🔥 {u.streak} ימים</span>
                  ) : null}
                  {u.age && (
                    <span className="text-xs text-muted-foreground">גיל {u.age}</span>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && !loadingStats && (
              <div className="text-center py-8 text-muted-foreground text-sm">לא נמצאו תוצאות</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
