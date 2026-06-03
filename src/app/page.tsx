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
import { FloatingLogButton } from '@/components/FloatingLogButton'
import { cn } from '@/lib/utils'
import { Undo2, Trophy } from 'lucide-react'
import { subscribeToMyChallenges, updateChallengeScores } from '@/lib/firestore'
import { Challenge } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useReminder } from '@/hooks/useReminder'

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const { count, log, undo } = useLogs(user?.uid)
  const { t, dir, lang } = useLanguage()
  const curr = profile?.currency ?? '₪'
  useReminder(profile?.reminderEnabled ?? false)
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

  const remainingText = lang === 'he'
    ? (remaining === 1 ? t('home_one_left') : `עוד ${remaining} סיגריות ליעד`)
    : (remaining === 1 ? t('home_one_left') : `${remaining} cigarettes left to goal`)

  const overText = lang === 'he'
    ? `עברת את היעד ב-${count - dailyGoal} סיגריות`
    : `${count - dailyGoal} cigarettes over goal`

  const overLimitShort = lang === 'he' ? `עברת ב-${count - dailyGoal}` : `${count - dailyGoal} over`
  const remainingShort = lang === 'he' ? `נשארו ${remaining}` : `${remaining} left`

  return (
    <div className="min-h-screen bg-background pb-28 flex flex-col" dir={dir}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-2">
        <div>
          <p className="text-muted-foreground text-sm">{t('home_hello')} {profile?.displayName?.split(' ')[0]}</p>
          <h1 className="text-xl font-bold">{t('home_today')}</h1>
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
            <div className="text-muted-foreground text-xs mt-1">{t('home_of')} {dailyGoal}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-[280px] mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500',
                overLimit ? 'bg-red-500' : count >= dailyGoal * 0.8 ? 'bg-amber-400' : 'bg-emerald-500')}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{overLimit ? overLimitShort : remainingShort}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center px-5 mt-3 mb-5 min-h-[24px]">
        {count === 0 && <p className="text-emerald-400 font-medium text-sm">{t('home_no_smokes')}</p>}
        {count > 0 && !overLimit && count < dailyGoal && (
          <p className="text-muted-foreground text-sm">{remainingText}</p>
        )}
        {count === dailyGoal && <p className="text-amber-400 font-medium text-sm">{t('home_goal_reached')}</p>}
        {overLimit && <p className="text-red-400 font-medium text-sm">{overText}</p>}
      </div>

      {/* BIG LOG BUTTON */}
      <div className="flex flex-col items-center gap-3 px-5">
        <button
          onClick={handleLog}
          className={cn(
            'w-full max-w-sm h-20 rounded-3xl font-black text-xl text-black',
            'transition-all duration-150 shadow-lg select-none active:scale-95',
            tapped ? 'scale-95 brightness-90' : 'scale-100',
            overLimit ? 'bg-red-500 shadow-red-500/25' : 'bg-amber-400 shadow-amber-400/25'
          )}
        >
          {t('home_add')}
        </button>

        <button
          onClick={undo}
          className="flex items-center gap-2 text-muted-foreground active:text-foreground text-sm py-2 px-4"
        >
          <Undo2 size={15} />
          {t('home_undo')}
        </button>
      </div>

      {/* Cost Incentive Card */}
      <div className={cn(
        'mx-5 mt-5 rounded-2xl p-4 border',
        count === 0 ? 'bg-emerald-500/8 border-emerald-500/25'
          : overLimit ? 'bg-red-500/8 border-red-500/25'
          : 'bg-emerald-500/8 border-emerald-500/25'
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('home_cost_vs_goal')}</p>
            {overLimit ? (
              <>
                <p className="text-xl font-black text-red-400">+{curr}{Math.abs(costDiff).toFixed(1)} {lang === 'he' ? 'מעל' : 'over'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'he' ? `${count - dailyGoal} סיגריות מעל היעד` : `${count - dailyGoal} cigarettes over goal`}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-emerald-400">
                  {count === 0
                    ? `${lang === 'he' ? 'חיסכון אפשרי' : 'Possible saving'} ${curr}${goalSpendToday.toFixed(1)}`
                    : `${lang === 'he' ? 'חסכת' : 'Saved'} ${curr}${costDiff.toFixed(1)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {count === 0
                    ? (lang === 'he' ? 'אם לא תעשן היום בכלל' : "If you don't smoke today")
                    : (lang === 'he' ? `${dailyGoal - count} פחות מהיעד` : `${dailyGoal - count} less than goal`)}
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
          <div className="text-2xl font-bold text-amber-400">{curr}{spentToday.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mt-1">{t('home_today_spend')}</div>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center">
          <div className={cn('text-2xl font-bold', (profile?.streak ?? 0) > 0 ? 'text-emerald-400' : 'text-muted-foreground')}>
            {profile?.streak ?? 0} 🔥
          </div>
          <div className="text-xs text-muted-foreground mt-1">{t('home_streak')}</div>
        </div>
      </div>

      {/* Active Challenges Widget */}
      {activeChallenges.length > 0 && (
        <div className="px-5 mt-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide flex items-center gap-1.5">
            <Trophy size={12} className="text-amber-400" /> {t('home_active_challenges')}
          </p>
          <div className="space-y-2">
            {activeChallenges.map((c) => {
              const scores = c.scores ?? {}
              const myScore = scores[user!.uid] ?? 0
              const sorted = Object.entries(scores).sort(([, a], [, b]) => a - b)
              const myRank = sorted.findIndex(([uid]) => uid === user!.uid)
              return (
                <div key={c.id} className="bg-card rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{myRank === 0 ? '🥇' : myRank === 1 ? '🥈' : '🥉'}</span>
                    <div>
                      <p className="text-xs font-semibold">{c.creatorName.split(' ')[0]}'s {t('home_active_challenges').split(' ')[0]}</p>
                      <p className="text-xs text-muted-foreground">{sorted.length} {t('home_participants')}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={cn('text-2xl font-black', myRank === 0 ? 'text-emerald-400' : 'text-foreground')}>{myScore}</span>
                    <p className="text-xs text-muted-foreground">{t('home_my_cigs')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <FloatingLogButton onLog={handleLog} overLimit={overLimit} />
      <NavBar />
      <GoalSetupModal open={showGoalSetup} onClose={() => setShowGoalSetup(false)} />
    </div>
  )
}
