'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { LoginScreen } from '@/components/LoginScreen'
import {
  createChallenge, requestJoinChallenge, approveJoinRequest, rejectJoinRequest,
  removeParticipantFromGroup, cancelChallenge, softDeleteChallenge, hardDeleteChallenge,
  leaveChallenge, startChallenge,
  subscribeToMyChallenges, getChallengeByCode,
  updateChallengeScores, sendChallengeMessage, subscribeToChallengeMessages,
} from '@/lib/firestore'
import { Challenge, ChallengeMessage, ChallengeParticipant } from '@/types'
import { Trophy, Plus, Link2, X, Check, Trash2, Ban, ChevronDown, ChevronUp, Send, Share2, CheckCheck, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { playMessageSound, showNotification } from '@/lib/sound'

const EMOJI_REACTIONS = ['💪', '😤', '🔥', '😂', '🏃', '🚬', '👑', '💸']
const PLACE_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

function ChallengeCard({ c, userId, userName, onRefresh }: {
  c: Challenge; userId: string; userName: string; onRefresh: () => void
}) {
  const isCreator = c.creatorId === userId
  const isMember = (c.participantIds ?? []).includes(userId)
  const isPending = (c.pendingRequestIds ?? []).includes(userId)

  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<ChallengeMessage[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelMsg, setCancelMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const prevMsgCount = useRef(0)
  const isInitialMsg = useRef(true)
  useEffect(() => {
    if (c.status === 'cancelled' || c.status === 'completed') return
    isInitialMsg.current = true
    const unsub = subscribeToChallengeMessages(c.id, (newMsgs) => {
      if (!isInitialMsg.current && newMsgs.length > prevMsgCount.current) {
        const latest = newMsgs[newMsgs.length - 1]
        if (latest && latest.userId !== userId) {
          playMessageSound()
          showNotification('הודעה חדשה בתחרות', `${latest.userName.split(' ')[0]}: ${latest.content}`)
        }
      }
      isInitialMsg.current = false
      prevMsgCount.current = newMsgs.length
      setMessages(newMsgs)
    })
    return unsub
  }, [c.id, c.status, userId])

  // Build sorted leaderboard
  const scores = c.scores ?? {}
  const todayScores = c.todayScores ?? {}
  const participants = c.participants ?? {}
  const leaderboard = Object.entries(scores)
    .map(([uid, total]) => ({
      uid,
      name: uid === c.creatorId ? c.creatorName : (participants[uid]?.displayName ?? uid),
      total,
      today: todayScores[uid] ?? 0,
      isMe: uid === userId,
    }))
    .sort((a, b) => a.total - b.total) // fewer cigs = better

  const pendingList = (Object.values(c.pendingRequests ?? {}) as (ChallengeParticipant | null)[]).filter(Boolean) as ChallengeParticipant[]

  const statusLabel = c.status === 'active' ? 'פעיל' : c.status === 'pending' ? 'ממתין' : c.status === 'cancelled' ? 'בוטל' : 'הסתיים'
  const statusColor = c.status === 'active' ? 'text-emerald-400' : c.status === 'pending' ? 'text-amber-400' : 'text-muted-foreground'

  async function handleShare() {
    const text = `הצטרף לתחרות שלי ב-Smokless!\nקוד: ${c.challengeCode}\n\nפתח אפליקציה → תחרויות → הצטרף → הזן קוד`
    if (navigator.share) await navigator.share({ title: 'תחרות Smokless', text })
    else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  async function handleSendMessage(content: string) {
    if (!content.trim()) return
    setSending(true)
    await sendChallengeMessage(c.id, userId, userName, content.trim())
    setMsgInput('')
    setSending(false)
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden mb-3">
      <button
        className="w-full p-4 text-right flex items-center justify-between active:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold', statusColor)}>● {statusLabel}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{c.type === 'weekly' ? 'שבועי' : 'חודשי'}</span>
          <span className="text-xs text-muted-foreground">· {(c.participantIds ?? []).filter(id => id !== c.creatorId).length}/{c.maxParticipants} חברים</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{c.creatorName.split(' ')[0]}'s group</span>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">

          {/* Leaderboard */}
          {c.status === 'active' && leaderboard.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">טבלת דירוג</p>
              {leaderboard.map((p, i) => (
                <div key={p.uid} className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2.5',
                  p.isMe ? 'bg-amber-400/15 border border-amber-400/30' : 'bg-muted/50'
                )}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{PLACE_EMOJIS[i]}</span>
                    <span className={cn('text-sm font-semibold', p.isMe ? 'text-amber-400' : 'text-foreground')}>
                      {p.name.split(' ')[0]}{p.isMe ? ' (אתה)' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground leading-none mb-0.5">היום</div>
                      <div className="text-lg font-black text-amber-400">{p.today}</div>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground leading-none mb-0.5">סה״כ</div>
                      <div className={cn('text-lg font-black', i === 0 ? 'text-emerald-400' : 'text-foreground')}>{p.total}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cancelled message */}
          {c.status === 'cancelled' && c.cancellationMessage && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3">
              <p className="text-xs text-red-400 font-semibold mb-1">הודעת ביטול:</p>
              <p className="text-sm">{c.cancellationMessage}</p>
            </div>
          )}

          {/* Challenge code + share (creator only, while pending/active) */}
          {isCreator && c.status !== 'cancelled' && c.status !== 'completed' && (
            <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1.5">קוד תחרות — שתף עם חברים</p>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xl tracking-widest text-amber-400">{c.challengeCode}</span>
                <button onClick={handleShare} className="flex items-center gap-1.5 bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                  {copied ? <><CheckCheck size={12} /> הועתק</> : <><Share2 size={12} /> שתף</>}
                </button>
              </div>
            </div>
          )}

          {/* Pending requests — creator approves/rejects each */}
          {isCreator && pendingList.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">בקשות הצטרפות</p>
              {pendingList.map((req) => (
                <div key={req.uid} className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">{req.displayName}</span>
                  <div className="flex gap-2">
                    <button onClick={async () => { await rejectJoinRequest(c.id, req.uid); onRefresh() }}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center active:scale-95">
                      <X size={14} />
                    </button>
                    <button onClick={async () => { await approveJoinRequest(c.id, req.uid); onRefresh() }}
                      className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center active:scale-95">
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Waiting for approval */}
          {isPending && !isMember && (
            <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 text-center">
              <p className="text-sm text-blue-400">⏳ מחכה לאישור מהיוצר</p>
            </div>
          )}

          {/* Start challenge button (creator, when enough players) */}
          {isCreator && c.status === 'pending' && (c.participantIds ?? []).length >= 2 && (
            <button
              onClick={async () => { await startChallenge(c.id); onRefresh() }}
              className="w-full h-10 rounded-xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Play size={14} /> התחל תחרות
            </button>
          )}

          {/* Messages */}
          {(c.status === 'active' || c.status === 'pending') && isMember && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">הודעות קבוצה</p>
              {messages.length > 0 && (
                <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className={cn('flex gap-2', m.userId === userId ? 'flex-row-reverse' : 'flex-row')}>
                      <div className={cn('max-w-[75%] rounded-2xl px-3 py-1.5 text-sm',
                        m.userId === userId ? 'bg-amber-400/20' : 'bg-muted'
                      )}>
                        {m.userId !== userId && <span className="text-xs text-muted-foreground block">{m.userName.split(' ')[0]}</span>}
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap mb-2">
                {EMOJI_REACTIONS.map((e) => (
                  <button key={e} onClick={() => handleSendMessage(e)} className="text-xl active:scale-90 transition-transform">{e}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(msgInput)}
                  placeholder="כתוב הודעה..." maxLength={100}
                  className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none" />
                <button onClick={() => handleSendMessage(msgInput)} disabled={!msgInput.trim() || sending}
                  className="w-9 h-9 bg-amber-400 text-black rounded-xl flex items-center justify-center disabled:opacity-40 active:scale-95">
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-border pt-3 space-y-2">
            {/* Leave (non-creator member) */}
            {!isCreator && isMember && c.status === 'active' && (
              <button onClick={async () => { await leaveChallenge(c.id, userId); onRefresh() }}
                className="w-full h-9 rounded-xl border border-border text-xs text-muted-foreground flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                <X size={13} /> עזוב תחרות
              </button>
            )}

            {/* Remove participants (creator) */}
            {isCreator && c.status === 'active' && Object.keys(participants).filter(u => u !== userId).map(uid => (
              <button key={uid} onClick={async () => { await removeParticipantFromGroup(c.id, uid); onRefresh() }}
                className="w-full h-9 rounded-xl border border-border text-xs text-muted-foreground flex items-center justify-center gap-1.5 active:scale-95">
                <X size={13} /> הסר את {participants[uid]?.displayName?.split(' ')[0]}
              </button>
            ))}

            {/* Cancel with message (creator) */}
            {isCreator && (c.status === 'pending' || c.status === 'active') && (
              !showCancel ? (
                <button onClick={() => setShowCancel(true)}
                  className="w-full h-9 rounded-xl border border-amber-500/40 text-amber-400 text-xs flex items-center justify-center gap-1.5 active:scale-95">
                  <Ban size={13} /> בטל תחרות עם הודעה
                </button>
              ) : (
                <div className="space-y-2">
                  <input value={cancelMsg} onChange={(e) => setCancelMsg(e.target.value)}
                    placeholder="הודעת ביטול (אופציונלי)"
                    className="w-full bg-muted rounded-xl px-3 py-2 text-sm focus:outline-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowCancel(false)} className="h-9 rounded-xl bg-muted text-xs active:scale-95">ביטול</button>
                    <button onClick={async () => { await cancelChallenge(c.id, cancelMsg); setShowCancel(false); onRefresh() }}
                      className="h-9 rounded-xl bg-amber-400 text-black text-xs font-semibold active:scale-95">אשר</button>
                  </div>
                </div>
              )
            )}

            {/* Hide from my list */}
            <button onClick={async () => { await softDeleteChallenge(c.id, userId); onRefresh() }}
              className="w-full h-9 rounded-xl border border-border text-xs text-muted-foreground flex items-center justify-center gap-1.5 active:scale-95">
              <Trash2 size={13} /> הסתר מהרשימה שלי
            </button>

            {/* Hard delete (creator only) */}
            {isCreator && (
              <button onClick={async () => { await hardDeleteChallenge(c.id); onRefresh() }}
                className="w-full h-9 rounded-xl border border-red-500/40 text-red-400 text-xs flex items-center justify-center gap-1.5 active:scale-95">
                <Trash2 size={13} /> מחק לכולם לגמרי
              </button>
            )}
          </div>
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
  const [createType, setCreateType] = useState<'weekly' | 'monthly'>('weekly')
  const [maxParticipants, setMaxParticipants] = useState(4)
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

  function refresh() { setRefreshKey(k => k + 1) }

  async function handleCreate() {
    if (!profile) return
    setCreateLoading(true)
    await createChallenge(profile, createType, maxParticipants)
    setCreateLoading(false)
    setShowCreate(false)
  }

  async function handleJoin() {
    if (!joinCode.trim() || !profile) return
    setJoinLoading(true)
    setJoinError('')
    try {
      const challenge = await getChallengeByCode(joinCode.trim())
      if (!challenge) { setJoinError('קוד תחרות לא נמצא.'); setJoinLoading(false); return }
      if (challenge.creatorId === user!.uid || (challenge.participantIds ?? []).includes(user!.uid)) {
        setJoinError('אתה כבר בתחרות הזו'); setJoinLoading(false); return
      }
      if ((challenge.pendingRequestIds ?? []).includes(user!.uid)) {
        setJoinError('כבר שלחת בקשה — ממתין לאישור'); setJoinLoading(false); return
      }
      if (challenge.status === 'cancelled' || challenge.status === 'completed') {
        setJoinError('התחרות הזו כבר לא פעילה'); setJoinLoading(false); return
      }
      const nonCreatorCount = (challenge.participantIds ?? []).filter(id => id !== challenge.creatorId).length
      if (nonCreatorCount >= challenge.maxParticipants) {
        setJoinError('התחרות מלאה — אין מקום למשתתפים נוספים'); setJoinLoading(false); return
      }
      await requestJoinChallenge(challenge.id, profile)
      setJoinSuccess(true)
      setJoinCode('')
      setTimeout(() => { setShowJoin(false); setJoinSuccess(false); refresh() }, 2000)
    } catch (e: unknown) { setJoinError(`שגיאה: ${e instanceof Error ? e.message : String(e)}`) }
    finally { setJoinLoading(false) }
  }

  const active = challenges.filter(c => c.status === 'active')
  const pending = challenges.filter(c => c.status === 'pending')
  const done = challenges.filter(c => c.status === 'cancelled' || c.status === 'completed')

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">תחרויות</h1>
          <p className="text-muted-foreground text-sm">מי מעשן פחות?</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowJoin(true); setJoinLoading(false); setJoinError(''); setJoinCode(''); setJoinSuccess(false) }}
            className="h-9 px-3 rounded-xl border border-border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all">
            <Link2 size={14} /> הצטרף
          </button>
          <button onClick={() => setShowCreate(true)}
            className="h-9 px-3 rounded-xl bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all">
            <Plus size={14} /> צור
          </button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-12 px-6 text-center">
          <div className="text-5xl mb-4">🥊</div>
          <h2 className="text-lg font-semibold mb-2">אין תחרויות עדיין</h2>
          <p className="text-muted-foreground text-sm mb-6">צור תחרות קבוצתית ושתף את הקוד עם חברים</p>
          <button onClick={() => setShowCreate(true)}
            className="h-12 px-8 rounded-2xl bg-amber-400 text-black font-bold active:scale-95 transition-all">
            צור תחרות
          </button>
        </div>
      ) : (
        <div className="px-5">
          {active.length > 0 && <><p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">פעילות</p>{active.map(c => <ChallengeCard key={c.id} c={c} userId={user.uid} userName={profile.displayName} onRefresh={refresh} />)}</>}
          {pending.length > 0 && <><p className="text-xs text-muted-foreground mb-2 mt-4 font-medium uppercase tracking-wide">ממתינות</p>{pending.map(c => <ChallengeCard key={c.id} c={c} userId={user.uid} userName={profile.displayName} onRefresh={refresh} />)}</>}
          {done.length > 0 && <><p className="text-xs text-muted-foreground mb-2 mt-4 font-medium uppercase tracking-wide">הסתיימו</p>{done.map(c => <ChallengeCard key={c.id} c={c} userId={user.uid} userName={profile.displayName} onRefresh={refresh} />)}</>}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 px-4 pb-8" onClick={() => setShowCreate(false)}>
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Trophy size={20} className="text-amber-400" /> צור תחרות</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>

            <p className="text-xs text-muted-foreground mb-3">סוג תחרות</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {(['weekly', 'monthly'] as const).map(t => (
                <button key={t} onClick={() => setCreateType(t)}
                  className={cn('h-10 rounded-xl text-sm font-semibold border transition-all active:scale-95',
                    createType === t ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-border text-foreground')}>
                  {t === 'weekly' ? '🗓 שבועי' : '📅 חודשי'}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mb-3">כמה חברים יכולים להצטרף (לא כולל אתה)</p>
            <div className="flex gap-2 flex-wrap mb-5">
              {[2, 3, 4, 5, 8, 10].map(n => (
                <button key={n} onClick={() => setMaxParticipants(n)}
                  className={cn('w-12 h-10 rounded-xl text-sm font-bold border transition-all active:scale-95',
                    maxParticipants === n ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-border')}>
                  {n}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              לאחר היצירה תקבל קוד ייחודי לשיתוף. כל משתתף שישלח בקשה — אתה תאשר.
            </p>

            <button onClick={handleCreate} disabled={createLoading}
              className="w-full h-12 rounded-2xl bg-amber-400 text-black font-bold text-sm active:scale-95 disabled:opacity-60">
              {createLoading ? 'יוצר...' : 'צור תחרות'}
            </button>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 px-4 pb-8" onClick={() => setShowJoin(false)}>
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">הצטרף לתחרות</h2>
              <button onClick={() => setShowJoin(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            {joinSuccess ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-emerald-400 font-semibold">בקשה נשלחה!</p>
                <p className="text-muted-foreground text-sm mt-1">ממתין לאישור מהיוצר</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">הזן את קוד התחרות שקיבלת מהחבר</p>
                <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="לדוגמה: AB1C2D" maxLength={6}
                  className="w-full border border-input bg-background rounded-xl px-4 py-3 text-center font-mono text-xl font-bold tracking-widest uppercase mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
                {joinError && <p className="text-red-400 text-sm text-center mb-3">{joinError}</p>}
                <button onClick={handleJoin} disabled={joinLoading || joinCode.length < 6}
                  className="w-full h-12 rounded-2xl bg-amber-400 text-black font-bold text-sm active:scale-95 disabled:opacity-50">
                  {joinLoading ? 'שולח...' : 'שלח בקשת הצטרפות'}
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
