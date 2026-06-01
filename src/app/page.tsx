'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLogs } from '@/hooks/useLogs'
import { NavBar } from '@/components/NavBar'
import { LoginScreen } from '@/components/LoginScreen'
import { GoalSetupModal } from '@/components/GoalSetupModal'
import { DailyMotivationBanner } from '@/components/DailyMotivationBanner'
import { LogoutMenu } from '@/components/LogoutMenu'
import { cn } from '@/lib/utils'
import { Undo2, Trophy } from 'lucide-react'
import { subscribeToMyChallenges, updateChallengeScores } from '@/lib/firestore'
import { Challenge } from '@/types'

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const { count, log, undo } = useLogs(user?.uid)
  const [showGoalSetup, setShowGoalSetup] = useState(false)
  const [tapped, setTapped] = useState(false)
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([])

  useEffect(() => {
    if (!user) return
    updateChallengeScores(user.uid)
    const unsub = subscribeToMyChallenges(user.uid, (all) => {
      setActiveChallenges(all.filter((c) => c.status === 'active'))
    })
    return unsub
  }, [user])

  const dailyGoal = profile?.dailyGoal ?? 10
  const pricePerCig = (profile?.pricePerPack ?? 35) / (profile?.cigarettesPerPack ?? 20)
  const spentToday = count * pricePerCig
  const goalSpendToday = dailyGoal * pricePerCig
  const costDiff = goalSpendToday - spentToday
  const overLimit = count > dailyGoal
  const progress = Math.min((count / dailyGoal) * 100, 100)
  const remaining = Math.max(dailyGoal - count, 0)

  async function handleLog() {
    setTapped(true)
    setTimeout(() => setTapped(false), 200)
    await log()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-5xl animate-pulse">🚬</div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <div className="min-h-screen bg-background pb-28 flex flex-col" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-2">
        <div>
          <p className="text-muted-foreground text-sm">שלום, {profile?.displayName?.split(' ')[0]}</p>
          <h1 className="text-xl font-bold">היום</h1>
        </div>
        <LogoutMenu onEditGoals={() => setShowGoalSetup(true)} />
      </div>

      <DailyMotivationBanner />

      {/* Counter Ring */}
      <div className="flex flex-col items-center mt-6 px-5">
        <div className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-300',
          'w-40 h-40 border-[6px]',
          overLimit ? 'border-red-500/50' : count >= dailyGoal * 0.8 ? 'border-amber-400/50' : 'border-emerald-500/50'
        )}>
          <div className="text-center">
            <div className={cn(
              'text-6xl font-black leading-none',
              overLimit ? 'text-red-400' : count >= dailyGoal * 0.8 ? 'text-amber-400' : 'text-emerald-400'
            )}>
              {count}
            </div>
            <div className="text-muted-foreground text-xs mt-1">מתוך {dailyGoal}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-[280px] mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                overLimit ? 'bg-red-500' : count >= dailyGoal * 0.8 ? 'bg-amber-400' : 'bg-emerald-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{overLimit ? `עברת ב-${count - dailyGoal}` : `נשארו ${remaining}`}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center px-5 mt-3 mb-5 min-h-[24px]">
        {count === 0 && <p className="text-emerald-400 font-medium text-sm">מצוין! עוד לא עישנת היום 🌟</p>}
        {count > 0 && !overLimit && count < dailyGoal && (
          <p className="text-muted-foreground text-sm">
            {remaining === 1 ? 'סיגריה אחת נשארה ליעד' : `עוד ${remaining} סיגריות ליעד`}
          </p>
        )}
        {count === dailyGoal && <p className="text-amber-400 font-medium text-sm">הגעת ליעד – עצור כאן! 💪</p>}
        {overLimit && <p className="text-red-400 font-medium text-sm">עברת את היעד ב-{count - dailyGoal} סיגריות</p>}
      </div>

      {/* BIG LOG BUTTON */}
      <div className="flex flex-col items-center gap-3 px-5">
        <button
          onClick={handleLog}
          className={cn(
            'w-full max-w-sm h-20 rounded-3xl font-black text-xl text-black',
            'transition-all duration-150 shadow-lg select-none active:scale-95',
            tapped ? 'scale-95 brightness-90' : 'scale-100',
            overLimit
              ? 'bg-red-500 shadow-red-500/25'
              : 'bg-amber-400 shadow-amber-400/25'
          )}
        >
          🚬 + סיגריה
        </button>

        <button
          onClick={undo}
          className="flex items-center gap-2 text-muted-foreground active:text-foreground text-sm py-2 px-4"
        >
          <Undo2 size={15} />
          בטל דיווח אחרון
        </button>
      </div>

      {/* Cost Incentive Card */}
      <div className={cn(
        'mx-5 mt-5 rounded-2xl p-4 border',
        count === 0
          ? 'bg-emerald-500/8 border-emerald-500/25'
          : overLimit
          ? 'bg-red-500/8 border-red-500/25'
          : 'bg-emerald-500/8 border-emerald-500/25'
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">עלות מול יעד היום</p>
            {overLimit ? (
              <>
                <p className="text-xl font-black text-red-400">
                  +₪{Math.abs(costDiff).toFixed(1)} מעל
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {count - dailyGoal} סיגריות מעל היעד
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-emerald-400">
                  {count === 0 ? `חיסכון אפשרי ₪${goalSpendToday.toFixed(1)}` : `חסכת ₪${costDiff.toFixed(1)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {count === 0 ? 'אם לא תעשן היום בכלל' : `${dailyGoal - count} פחות מהיעד`}
                </p>
              </>
            )}
          </div>
          <div className="text-4xl mr-2">
            {overLimit ? '💸' : count === 0 ? '💰' : '✅'}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        <div className="bg-card rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">₪{spentToday.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mt-1">הוצאת היום</div>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center">
          <div className={cn('text-2xl font-bold', (profile?.streak ?? 0) > 0 ? 'text-emerald-400' : 'text-muted-foreground')}>
            {profile?.streak ?? 0} 🔥
          </div>
          <div className="text-xs text-muted-foreground mt-1">ימי רצף</div>
        </div>
      </div>

      {/* Active Challenges Widget */}
      {activeChallenges.length > 0 && (
        <div className="px-5 mt-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide flex items-center gap-1.5">
            <Trophy size={12} className="text-amber-400" /> תחרויות פעילות
          </p>
          <div className="space-y-2">
            {activeChallenges.map((c) => {
              const isCreator = c.creatorId === user!.uid
              const myScore = isCreator ? c.creatorTotal : c.participantTotal
              const theirScore = isCreator ? c.participantTotal : c.creatorTotal
              const theirName = isCreator ? c.participantName : c.creatorName
              const iWin = myScore < theirScore
              const theyWin = theirScore < myScore
              return (
                <div key={c.id} className="bg-card rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-2xl font-black', iWin ? 'text-emerald-400' : theyWin ? 'text-red-400' : 'text-foreground')}>{myScore}</span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className={cn('text-2xl font-black', theyWin ? 'text-red-400' : iWin ? 'text-emerald-400' : 'text-foreground')}>{theirScore}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold">{theirName?.split(' ')[0]}</p>
                    <p className="text-xs text-muted-foreground">{iWin ? '🏆 אתה מוביל' : theyWin ? '📈 מוביל' : '🤝 תיקו'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <NavBar />
      <GoalSetupModal open={showGoalSetup} onClose={() => setShowGoalSetup(false)} />
    </div>
  )
}
