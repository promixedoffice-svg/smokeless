'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { LoginScreen } from '@/components/LoginScreen'
import {
  createChallenge, requestJoinChallenge, approveJoinRequest, rejectJoinRequest,
  removeParticipant, cancelChallenge, deleteChallenge,
  subscribeToMyChallenges,
  getUserByInviteCode, getPendingChallengeByCreator,
  updateChallengeScores, sendChallengeMessage, subscribeToChallengeMessages,
} from '@/lib/firestore'
import { Challenge, ChallengeMessage } from '@/types'
import { Trophy, Plus, Link2, X, Check, MessageCircle, Trash2, Ban, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMOJI_REACTIONS = ['💪', '😤', '🔥', '😂', '🏃', '🚬', '👑', '💸']

function ChallengeCard({
  c, userId, userName, onRefresh
}: {
  c: Challenge
  userId: string
  userName: string
  onRefresh: () => void
}) {
  const isCreator = c.creatorId === userId
  const isParticipant = c.participantId === userId
  const isRequester = c.requesterId === userId
  const myScore = isCreator ? c.creatorTotal : c.participantTotal
  const theirScore = isCreator ? c.participantTotal : c.creatorTotal
  const theirName = isCreator ? (c.participantName ?? c.requesterName) : c.creatorName
  const iWin = c.status === 'active' && myScore < theirScore
  const theyWin = c.status === 'active' && theirScore < myScore

  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<ChallengeMessage[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelMsg, setCancelMsg] = useState('')

  useEffect(() => {
    if (!expanded || c.status === 'cancelled' || c.status === 'pending') return
    const unsub = subscribeToChallengeMessages(c.id, setMessages)
    return unsub
  }, [expanded, c.id, c.status])

  async function handleSendMessage(content: string) {
    if (!content.trim()) return
    setSending(true)
    await sendChallengeMessage(c.id, userId, userName, content.trim())
    setMsgInput('')
    setSending(false)
  }

  async function handleApprove() {
    await approveJoinRequest(c.id)
    onRefresh()
  }

  async function handleReject() {
    await rejectJoinRequest(c.id)
    onRefresh()
  }

  async function handleRemove() {
    await removeParticipant(c.id)
    onRefresh()
  }

  async function handleCancel() {
    await cancelChallenge(c.id, cancelMsg)
    setShowCancel(false)
    onRefresh()
  }

  async function handleDelete() {
    await deleteChallenge(c.id)
    onRefresh()
  }

  const statusColor = c.status === 'active' ? 'text-emerald-400' :
    c.status === 'pending' ? 'text-amber-400' :
    c.status === 'pending_approval' ? 'text-blue-400' :
    c.status === 'cancelled' ? 'text-red-400' : 'text-muted-foreground'

  const statusLabel = c.status === 'active' ? 'פעיל' :
    c.status === 'pending' ? 'ממתין לחבר' :
    c.status === 'pending_approval' ? 'ממתין לאישור' :
    c.status === 'cancelled' ? 'בוטל' : 'הסתיים'

  return (
    <div className="bg-card rounded-2xl overflow-hidden mb-3">
      {/* Header */}
      <button
        className="w-full p-4 text-right flex items-center justify-between active:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold', statusColor)}>● {statusLabel}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{c.type === 'weekly' ? 'שבועי' : 'חודשי'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-right">
            {theirName ? `מול ${theirName.split(' ')[0]}` : 'ממתין להצטרפות'}
          </span>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">

          {/* Score Board */}
          {c.status === 'active' && (
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className={cn('rounded-xl p-3 text-center', iWin ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-muted/50')}>
                <div className="text-xs text-muted-foreground mb-1">אתה</div>
                <div className={cn('text-3xl font-black', iWin ? 'text-emerald-400' : 'text-foreground')}>{myScore}</div>
                {iWin && <div className="text-xs text-emerald-400 mt-1">🏆 מוביל</div>}
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-muted-foreground">VS</div>
                <div className="text-xs text-muted-foreground mt-1">עד {c.endDate}</div>
              </div>
              <div className={cn('rounded-xl p-3 text-center', theyWin ? 'bg-red-500/15 border border-red-500/30' : 'bg-muted/50')}>
                <div className="text-xs text-muted-foreground mb-1">{theirName?.split(' ')[0]}</div>
                <div className={cn('text-3xl font-black', theyWin ? 'text-red-400' : 'text-foreground')}>{theirScore}</div>
                {theyWin && <div className="text-xs text-red-400 mt-1">📈 מוביל</div>}
              </div>
            </div>
          )}

          {/* Cancelled message */}
          {c.status === 'cancelled' && c.cancellationMessage && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3">
              <p className="text-xs text-red-400 font-semibold mb-1">הודעת ביטול:</p>
              <p className="text-sm text-foreground">{c.cancellationMessage}</p>
            </div>
          )}

          {/* Pending approval — creator sees approve/reject */}
          {c.status === 'pending_approval' && isCreator && (
            <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-4">
              <p className="text-sm font-semibold mb-3">
                {c.requesterName} מבקש להצטרף לתחרות
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleReject}
                  className="h-10 rounded-xl border border-border text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <X size={14} /> דחה
                </button>
                <button
                  onClick={handleApprove}
                  className="h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Check size={14} /> אשר
                </button>
              </div>
            </div>
          )}

          {/* Pending approval — requester waiting */}
          {c.status === 'pending_approval' && isRequester && (
            <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 text-center">
              <p className="text-sm text-blue-400">⏳ מחכה לאישור מ-{c.creatorName.split(' ')[0]}</p>
            </div>
          )}

          {/* Messages */}
          {(c.status === 'active' || c.status === 'pending_approval') && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">הודעות</p>

              {messages.length > 0 && (
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className={cn('flex gap-2', m.userId === userId ? 'flex-row-reverse' : 'flex-row')}>
                      <div className={cn(
                        'max-w-[70%] rounded-2xl px-3 py-2 text-sm',
                        m.userId === userId ? 'bg-amber-400/20 text-right' : 'bg-muted text-right'
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Emoji reactions */}
              <div className="flex gap-2 flex-wrap mb-2">
                {EMOJI_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendMessage(emoji)}
                    className="text-xl active:scale-90 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Text input */}
              <div className="flex gap-2">
                <input
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(msgInput)}
                  placeholder="כתוב הודעה..."
                  className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none"
                  maxLength={100}
                />
                <button
                  onClick={() => handleSendMessage(msgInput)}
                  disabled={!msgInput.trim() || sending}
                  className="w-9 h-9 bg-amber-400 text-black rounded-xl flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Creator actions */}
          {isCreator && c.status !== 'cancelled' && c.status !== 'completed' && (
            <div className="border-t border-border pt-3 space-y-2">
              {c.status === 'active' && (
                <button
                  onClick={handleRemove}
                  className="w-full h-9 rounded-xl border border-border text-xs text-muted-foreground flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <X size={13} /> הסר משתתף
                </button>
              )}

              {!showCancel ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowCancel(true)}
                    className="h-9 rounded-xl border border-amber-500/40 text-amber-400 text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Ban size={13} /> בטל תחרות
                  </button>
                  <button
                    onClick={handleDelete}
                    className="h-9 rounded-xl border border-red-500/40 text-red-400 text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Trash2 size={13} /> מחק
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={cancelMsg}
                    onChange={(e) => setCancelMsg(e.target.value)}
                    placeholder="הודעת ביטול לחברים (אופציונלי)"
                    className="w-full bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowCancel(false)} className="h-9 rounded-xl bg-muted text-xs active:scale-95">
                      ביטול
                    </button>
                    <button onClick={handleCancel} className="h-9 rounded-xl bg-amber-400 text-black text-xs font-semibold active:scale-95">
                      אשר ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FriendsPage() {
  const { user, profile, loading } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToMyChallenges(user.uid, setChallenges)
    updateChallengeScores(user.uid)
    return unsub
  }, [user, refreshKey])

  if (loading) return null
  if (!user || !profile) return <LoginScreen />

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  async function handleCreate(type: 'weekly' | 'monthly') {
    if (!profile) return
    setCreateLoading(true)
    await createChallenge(profile, type)
    setCreateLoading(false)
    setShowCreate(false)
  }

  async function handleJoin() {
    if (!joinCode.trim() || !profile) return
    setJoinLoading(true)
    setJoinError('')

    try {
      const creator = await getUserByInviteCode(joinCode.trim())
      if (!creator) {
        setJoinError('קוד לא נמצא. בדוק שוב.')
        setJoinLoading(false)
        return
      }
      if (creator.uid === user!.uid) {
        setJoinError('לא ניתן להצטרף לאתגר שלך עצמך')
        setJoinLoading(false)
        return
      }

      const challenge = await getPendingChallengeByCreator(creator.uid)
      if (!challenge) {
        setJoinError('אין אתגר פתוח מאותו משתמש. בקש ממנו ליצור תחרות.')
        setJoinLoading(false)
        return
      }

      await requestJoinChallenge(challenge.id, profile)
      setJoinSuccess(true)
      setJoinCode('')
      setTimeout(() => {
        setShowJoin(false)
        setJoinSuccess(false)
        refresh()
      }, 2000)
    } catch (err) {
      setJoinError('שגיאה: בדוק שה-Firestore Rules עודכנו ב-Firebase.')
    } finally {
      setJoinLoading(false)
    }
  }

  const active = challenges.filter((c) => c.status === 'active')
  const pending = challenges.filter((c) => c.status === 'pending' || c.status === 'pending_approval')
  const done = challenges.filter((c) => c.status === 'cancelled' || c.status === 'completed')

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">תחרויות</h1>
          <p className="text-muted-foreground text-sm">מי מעשן פחות?</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="h-9 px-3 rounded-xl border border-border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Link2 size={14} /> הצטרף
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="h-9 px-3 rounded-xl bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus size={14} /> צור
          </button>
        </div>
      </div>

      {/* My Invite Code */}
      <div className="mx-5 bg-card rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">הקוד שלי לשיתוף</div>
          <div className="font-mono font-black text-2xl tracking-widest text-amber-400">
            {profile.inviteCode}
          </div>
          <div className="text-xs text-muted-foreground mt-1">שתף עם חבר כדי שיצטרף לתחרות שלך</div>
        </div>
        <div className="text-3xl">🏷️</div>
      </div>

      {challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-12 px-6 text-center">
          <div className="text-5xl mb-4">🥊</div>
          <h2 className="text-lg font-semibold mb-2">אין תחרויות עדיין</h2>
          <p className="text-muted-foreground text-sm mb-6">
            צור תחרות ושתף את הקוד שלך עם חבר
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="h-12 px-8 rounded-2xl bg-amber-400 text-black font-bold active:scale-95 transition-all"
          >
            צור תחרות ראשונה
          </button>
        </div>
      ) : (
        <div className="px-5">
          {active.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">פעילות</p>
              {active.map((c) => (
                <ChallengeCard key={c.id} c={c} userId={user.uid} userName={profile.displayName} onRefresh={refresh} />
              ))}
            </>
          )}
          {pending.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2 mt-4 font-medium uppercase tracking-wide">ממתינות</p>
              {pending.map((c) => (
                <ChallengeCard key={c.id} c={c} userId={user.uid} userName={profile.displayName} onRefresh={refresh} />
              ))}
            </>
          )}
          {done.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2 mt-4 font-medium uppercase tracking-wide">הסתיימו</p>
              {done.map((c) => (
                <ChallengeCard key={c.id} c={c} userId={user.uid} userName={profile.displayName} onRefresh={refresh} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 px-4 pb-8" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" /> צור תחרות
              </h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              שתף את הקוד שלך עם חבר לאחר יצירת התחרות. הוא יצטרך לבקש הצטרפות ואתה תאשר.
            </p>
            <div className="font-mono text-center text-3xl font-black text-amber-400 py-3 bg-amber-400/10 rounded-2xl mb-4">
              {profile.inviteCode}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleCreate('weekly')}
                disabled={createLoading}
                className="w-full h-12 rounded-2xl bg-amber-400 text-black font-bold text-sm active:scale-95 transition-all disabled:opacity-60"
              >
                🗓 תחרות שבועית (7 ימים)
              </button>
              <button
                onClick={() => handleCreate('monthly')}
                disabled={createLoading}
                className="w-full h-12 rounded-2xl border border-border text-sm font-semibold active:scale-95 transition-all disabled:opacity-60"
              >
                📅 תחרות חודשית (עד סוף חודש)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 px-4 pb-8" onClick={() => setShowJoin(false)}>
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">הצטרף לתחרות</h2>
              <button onClick={() => setShowJoin(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>

            {joinSuccess ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-emerald-400 font-semibold">בקשה נשלחה!</p>
                <p className="text-muted-foreground text-sm mt-1">ממתין לאישור מהחבר שלך</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  הזן את הקוד האישי של החבר שיצר תחרות. הוא יקבל בקשה ויאשר אותך.
                </p>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="לדוגמה: AB1C2D"
                  maxLength={6}
                  className="w-full border border-input bg-background rounded-xl px-4 py-3 text-center font-mono text-xl font-bold tracking-widest uppercase mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
                {joinError && (
                  <p className="text-red-400 text-sm text-center mb-3">{joinError}</p>
                )}
                <button
                  onClick={handleJoin}
                  disabled={joinLoading || joinCode.length < 6}
                  className="w-full h-12 rounded-2xl bg-amber-400 text-black font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {joinLoading ? 'שולח בקשה...' : 'שלח בקשת הצטרפות'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <NavBar />
    </div>
  )
}
