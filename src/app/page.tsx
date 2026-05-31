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
import { Undo2 } from 'lucide-react'

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const { count, log, undo } = useLogs(user?.uid)
  const [showGoalSetup, setShowGoalSetup] = useState(false)
  const [tapped, setTapped] = useState(false)

  const dailyGoal = profile?.dailyGoal ?? 10
  const progress = Math.min((count / dailyGoal) * 100, 100)
  const remaining = Math.max(dailyGoal - count, 0)
  const pricePerCig = (profile?.pricePerPack ?? 35) / (profile?.cigarettesPerPack ?? 20)
  const spentToday = (count * pricePerCig).toFixed(1)
  const overLimit = count > dailyGoal

  async function handleLog() {
    setTapped(true)
    setTimeout(() => setTapped(false), 300)
    await log()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-4xl animate-pulse">🚬</div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <div>
          <p className="text-muted-foreground text-sm">שלום, {profile?.displayName?.split(' ')[0]}</p>
          <h1 className="text-xl font-bold">היום</h1>
        </div>
        <LogoutMenu onEditGoals={() => setShowGoalSetup(true)} />
      </div>

      {/* Motivation Banner */}
      <DailyMotivationBanner />

      {/* Counter Ring */}
      <div className="flex flex-col items-center mt-6 mb-4 px-4">
        <div className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-300',
          'w-44 h-44 border-8',
          overLimit ? 'border-red-500/40' : count >= dailyGoal * 0.8 ? 'border-amber-400/40' : 'border-emerald-500/40'
        )}>
          <div className="text-center">
            <div className={cn(
              'text-6xl font-black leading-none',
              overLimit ? 'text-red-400' : count >= dailyGoal * 0.8 ? 'text-amber-400' : 'text-emerald-400'
            )}>
              {count}
            </div>
            <div className="text-muted-foreground text-sm mt-1">מתוך {dailyGoal}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                overLimit ? 'bg-red-500' : count >= dailyGoal * 0.8 ? 'bg-amber-400' : 'bg-emerald-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{overLimit ? `עברת ב-${count - dailyGoal}` : `נשארו ${remaining}`}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center px-4 mb-6 min-h-[40px]">
        {count === 0 && (
          <p className="text-emerald-400 font-medium">מצוין! עוד לא עישנת היום 🌟</p>
        )}
        {count > 0 && !overLimit && count < dailyGoal && (
          <p className="text-muted-foreground text-sm">
            {remaining === 1 ? 'סיגריה אחת נשארה ליעד' : `עוד ${remaining} סיגריות ליעד`}
          </p>
        )}
        {count === dailyGoal && (
          <p className="text-amber-400 font-medium">הגעת ליעד היומי – עצור כאן! 💪</p>
        )}
        {overLimit && (
          <p className="text-red-400 font-medium">עברת את היעד ב-{count - dailyGoal} סיגריות</p>
        )}
      </div>

      {/* BIG LOG BUTTON */}
      <div className="flex flex-col items-center gap-4 px-6">
        <button
          onClick={handleLog}
          className={cn(
            'w-full max-w-xs h-24 rounded-3xl font-black text-2xl text-black',
            'transition-all duration-150 shadow-lg select-none',
            tapped ? 'scale-95' : 'scale-100',
            overLimit
              ? 'bg-red-500 hover:bg-red-400 shadow-red-500/30'
              : 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/30'
          )}
        >
          🚬 + סיגריה
        </button>

        <button
          onClick={undo}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <Undo2 size={16} />
          בטל דיווח אחרון
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-8">
        <div className="bg-card rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">₪{spentToday}</div>
          <div className="text-xs text-muted-foreground mt-1">הוצאת היום</div>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center">
          <div className={cn('text-2xl font-bold', overLimit ? 'text-red-400' : 'text-emerald-400')}>
            {profile?.streak ?? 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1">ימי רצף</div>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {dailyGoal - count > 0 ? `${dailyGoal - count}` : '0'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">נשאר ליעד</div>
        </div>
      </div>

      <NavBar />
      <GoalSetupModal open={showGoalSetup} onClose={() => setShowGoalSetup(false)} />
    </div>
  )
}
