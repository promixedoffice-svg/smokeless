'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { LoginScreen } from '@/components/LoginScreen'
import { getWeekStats, getMonthTotal } from '@/lib/firestore'
import { DayStats } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const { t, dir, lang } = useLanguage()
  const curr = profile?.currency ?? '₪'
  const [weekStats, setWeekStats] = useState<DayStats[]>([])
  const [monthTotal, setMonthTotal] = useState(0)
  const [loadingData, setLoadingData] = useState(true)

  const dailyGoal = profile?.dailyGoal ?? 10
  const pricePerCig = (profile?.pricePerPack ?? 35) / (profile?.cigarettesPerPack ?? 20)

  useEffect(() => {
    if (!user || !profile) return
    setLoadingData(true)
    Promise.all([
      getWeekStats(user.uid, profile.dailyGoal),
      getMonthTotal(user.uid),
    ]).then(([week, month]) => {
      setWeekStats(week)
      setMonthTotal(month)
      setLoadingData(false)
    })
  }, [user, profile])

  if (loading) return null
  if (!user) return <LoginScreen />

  const weekTotal = weekStats.reduce((s, d) => s + d.count, 0)
  const weekGoalTotal = dailyGoal * 7
  const daysUnderGoal = weekStats.filter((d) => d.count <= dailyGoal).length
  const avgPerDay = weekTotal > 0 ? (weekTotal / weekStats.length).toFixed(1) : '0'

  const weekActualCost = weekTotal * pricePerCig
  const weekGoalCost = weekGoalTotal * pricePerCig
  const weekCostDiff = weekGoalCost - weekActualCost
  const weekSaved = weekCostDiff > 0

  const daysInMonth = new Date().getDate()
  const monthGoalTotal = dailyGoal * daysInMonth
  const monthActualCost = monthTotal * pricePerCig
  const monthGoalCost = monthGoalTotal * pricePerCig
  const monthCostDiff = monthGoalCost - monthActualCost
  const monthSaved = monthCostDiff > 0

  const hebrewDayLabels = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
  const englishDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const chartData = lang === 'en'
    ? weekStats.map((d, i) => ({ ...d, label: englishDayLabels[i] ?? d.label }))
    : weekStats

  const healthMilestones = [
    { time: lang === 'he' ? '20 דקות' : '20 min', text: t('dash_health_20m'), icon: '❤️' },
    { time: lang === 'he' ? '8 שעות' : '8 hours', text: t('dash_health_8h'), icon: '🫁' },
    { time: lang === 'he' ? '24 שעות' : '24 hours', text: t('dash_health_24h'), icon: '💪' },
    { time: lang === 'he' ? '48 שעות' : '48 hours', text: t('dash_health_48h'), icon: '👃' },
    { time: lang === 'he' ? '2 שבועות' : '2 weeks', text: t('dash_health_2w'), icon: '🩸' },
  ]

  return (
    <div className="min-h-screen bg-background pb-28" dir={dir}>
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold">{t('dash_title')}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t('dash_subtitle')}</p>
      </div>

      {/* Week Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-4">
        <div className="bg-card rounded-2xl p-4">
          <div className="text-3xl font-black text-amber-400">{weekTotal}</div>
          <div className="text-xs text-muted-foreground mt-1">{t('dash_week_total')}</div>
        </div>
        <div className="bg-card rounded-2xl p-4">
          <div className={cn('text-3xl font-black', daysUnderGoal >= 5 ? 'text-emerald-400' : 'text-red-400')}>
            {daysUnderGoal}/7
          </div>
          <div className="text-xs text-muted-foreground mt-1">{t('dash_days_on_goal')}</div>
        </div>
        <div className="bg-card rounded-2xl p-4">
          <div className="text-3xl font-black text-blue-400">{avgPerDay}</div>
          <div className="text-xs text-muted-foreground mt-1">{t('dash_avg')}</div>
        </div>
        <div className="bg-card rounded-2xl p-4">
          <div className="text-3xl font-black text-rose-400">{curr}{monthActualCost.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground mt-1">{t('dash_monthly_spend')}</div>
        </div>
      </div>

      {/* Cost Comparison Section */}
      <div className="px-5 mb-4">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">{t('dash_cost_vs_goal')}</p>

        <div className={cn('rounded-2xl p-4 border mb-3',
          weekSaved ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-red-500/8 border-red-500/25')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('dash_this_week')}</p>
              <div className="flex items-baseline gap-1.5">
                {weekSaved
                  ? <TrendingDown size={16} className="text-emerald-400 mb-0.5" />
                  : <TrendingUp size={16} className="text-red-400 mb-0.5" />}
                <p className={cn('text-xl font-black', weekSaved ? 'text-emerald-400' : 'text-red-400')}>
                  {weekSaved
                    ? `${lang === 'he' ? 'חסכת' : 'Saved'} ${curr}${weekCostDiff.toFixed(0)}`
                    : `${lang === 'he' ? 'הוצאת' : 'Spent'} ${curr}${Math.abs(weekCostDiff).toFixed(0)} ${lang === 'he' ? 'יותר' : 'more'}`}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('dash_actual')} {curr}{weekActualCost.toFixed(0)} · {t('dash_goal_cost')} {curr}{weekGoalCost.toFixed(0)}
              </p>
            </div>
            <div className="text-3xl">{weekSaved ? '✅' : '💸'}</div>
          </div>
        </div>

        <div className={cn('rounded-2xl p-4 border',
          monthSaved ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-red-500/8 border-red-500/25')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('dash_this_month')}</p>
              <div className="flex items-baseline gap-1.5">
                {monthSaved
                  ? <TrendingDown size={16} className="text-emerald-400 mb-0.5" />
                  : <TrendingUp size={16} className="text-red-400 mb-0.5" />}
                <p className={cn('text-xl font-black', monthSaved ? 'text-emerald-400' : 'text-red-400')}>
                  {monthSaved
                    ? `${lang === 'he' ? 'חסכת' : 'Saved'} ${curr}${monthCostDiff.toFixed(0)}`
                    : `${lang === 'he' ? 'הוצאת' : 'Spent'} ${curr}${Math.abs(monthCostDiff).toFixed(0)} ${lang === 'he' ? 'יותר' : 'more'}`}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('dash_actual')} {curr}{monthActualCost.toFixed(0)} · {t('dash_goal_cost')} {curr}{monthGoalCost.toFixed(0)}
              </p>
            </div>
            <div className="text-3xl">{monthSaved ? '💰' : '📉'}</div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-card mx-5 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold mb-4">{t('dash_by_day')}</h2>
        {loadingData ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">{t('dash_loading')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#ccc' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <ReferenceLine y={dailyGoal} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {weekStats.map((entry, i) => (
                  <Cell key={i} fill={entry.count > entry.goal ? '#ef4444' : entry.count >= entry.goal * 0.8 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{t('dash_on_goal')}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{t('dash_near_goal')}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{t('dash_over_goal')}</span>
        </div>
      </div>

      {/* Health Milestones */}
      <div className="bg-card mx-5 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold mb-3">{t('dash_health_title')}</h2>
        <div className="space-y-3.5">
          {healthMilestones.map(({ time, text, icon }) => (
            <div key={time} className="flex items-center gap-3">
              <span className="text-xl w-7 text-center">{icon}</span>
              <div>
                <div className="text-xs font-semibold text-amber-400">{time} {t('dash_smoke_free')}</div>
                <div className="text-xs text-muted-foreground">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NavBar />
    </div>
  )
}
