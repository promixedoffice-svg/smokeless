'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { LoginScreen } from '@/components/LoginScreen'
import {
  createChallenge, joinChallenge, subscribeToMyChallenges,
  getUserByInviteCode, updateChallengeScores,
} from '@/lib/firestore'
import { Challenge } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Trophy, Plus, Users, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function FriendsPage() {
  const { user, profile, loading } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToMyChallenges(user.uid, setChallenges)
    updateChallengeScores(user.uid)
    return unsub
  }, [user])

  if (loading) return null
  if (!user || !profile) return <LoginScreen />

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

    const pending = challenges.find(
      (c) => c.status === 'pending' && c.creatorId !== user!.uid
    )
    if (pending) {
      setJoinError('כבר יש לך אתגר ממתין')
      setJoinLoading(false)
      return
    }

    const creator = await getUserByInviteCode(joinCode)
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

    const existing = challenges.find((c) => c.status === 'pending' && c.creatorId === creator.uid)
    if (!existing) {
      setJoinError('אין אתגר פתוח מאותו משתמש')
      setJoinLoading(false)
      return
    }

    await joinChallenge(existing.id, profile)
    setJoinLoading(false)
    setShowJoin(false)
    setJoinCode('')
  }

  function getWinner(c: Challenge) {
    if (!c.participantId) return null
    if (c.creatorTotal < c.participantTotal) return c.creatorId
    if (c.participantTotal < c.creatorTotal) return c.participantId
    return 'tie'
  }

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">תחרויות</h1>
          <p className="text-muted-foreground text-sm">התחרה עם חברים – מי מעשן פחות?</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowJoin(true)}
            className="h-9 px-3 text-xs"
          >
            <Link2 size={14} className="ml-1" /> הצטרף
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
            className="h-9 px-3 text-xs bg-amber-400 hover:bg-amber-300 text-black"
          >
            <Plus size={14} className="ml-1" /> צור
          </Button>
        </div>
      </div>

      {/* My Invite Code */}
      <div className="mx-4 bg-card rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">הקוד שלי לשיתוף</div>
          <div className="font-mono font-black text-2xl tracking-widest text-amber-400">
            {profile.inviteCode}
          </div>
        </div>
        <div className="text-3xl">🏷️</div>
      </div>

      {/* Challenges List */}
      {challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-16 px-6 text-center">
          <div className="text-5xl mb-4">🥊</div>
          <h2 className="text-lg font-semibold mb-2">אין תחרויות עדיין</h2>
          <p className="text-muted-foreground text-sm mb-6">
            שתף את הקוד שלך עם חבר, או הצטרף לתחרות עם קוד החבר שלך
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-8"
          >
            צור תחרות ראשונה
          </Button>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {challenges.map((c) => {
            const isCreator = c.creatorId === user.uid
            const myScore = isCreator ? c.creatorTotal : c.participantTotal
            const theirScore = isCreator ? c.participantTotal : c.creatorTotal
            const theirName = isCreator ? c.participantName : c.creatorName
            const winner = getWinner(c)
            const iWin = winner === user.uid
            const theyWin = winner && winner !== user.uid && winner !== 'tie'

            return (
              <div key={c.id} className="bg-card rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {theirName ?? 'ממתין להצטרפות...'}
                    </span>
                  </div>
                  <Badge variant={
                    c.status === 'active' ? 'default' :
                    c.status === 'pending' ? 'secondary' : 'outline'
                  } className="text-xs">
                    {c.status === 'active' ? 'פעיל' : c.status === 'pending' ? 'ממתין' : 'הסתיים'}
                  </Badge>
                </div>

                {c.status === 'active' && (
                  <div className="flex items-center gap-3 mb-3">
                    {/* My score */}
                    <div className={cn(
                      'flex-1 rounded-xl p-3 text-center',
                      iWin ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-muted'
                    )}>
                      <div className="text-xs text-muted-foreground mb-1">אתה</div>
                      <div className={cn('text-3xl font-black', iWin ? 'text-emerald-400' : 'text-foreground')}>
                        {myScore}
                      </div>
                      {iWin && <div className="text-xs text-emerald-400 mt-1">מנצח 🏆</div>}
                    </div>

                    <div className="text-muted-foreground font-bold text-lg">VS</div>

                    {/* Their score */}
                    <div className={cn(
                      'flex-1 rounded-xl p-3 text-center',
                      theyWin ? 'bg-red-500/10 border border-red-500/30' : 'bg-muted'
                    )}>
                      <div className="text-xs text-muted-foreground mb-1">{theirName?.split(' ')[0]}</div>
                      <div className={cn('text-3xl font-black', theyWin ? 'text-red-400' : 'text-foreground')}>
                        {theirScore}
                      </div>
                      {theyWin && <div className="text-xs text-red-400 mt-1">מוביל</div>}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{c.type === 'weekly' ? 'שבועי' : 'חודשי'}</span>
                  <span>עד {c.endDate}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" /> צור תחרות
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              בחר סוג תחרות. שתף את הקוד שלך עם חבר כדי שיצטרף.
            </p>
            <div className="font-mono text-center text-3xl font-black text-amber-400 py-2">
              {profile.inviteCode}
            </div>
            <Button
              onClick={() => handleCreate('weekly')}
              disabled={createLoading}
              className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-black font-bold"
            >
              תחרות שבועית (7 ימים)
            </Button>
            <Button
              onClick={() => handleCreate('monthly')}
              disabled={createLoading}
              variant="outline"
              className="w-full h-12"
            >
              תחרות חודשית (עד סוף חודש)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent className="max-w-sm mx-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">הצטרף לתחרות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              הזן את הקוד האישי של החבר שיצר תחרות
            </p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="לדוגמה: AB1C2D"
              maxLength={6}
              className="w-full border border-input bg-background rounded-xl px-4 py-3 text-center font-mono text-xl font-bold tracking-widest uppercase"
            />
            {joinError && (
              <p className="text-red-400 text-sm text-center">{joinError}</p>
            )}
            <Button
              onClick={handleJoin}
              disabled={joinLoading || joinCode.length < 6}
              className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-black font-bold"
            >
              {joinLoading ? 'מצטרף...' : 'הצטרף לתחרות'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <NavBar />
    </div>
  )
}
