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

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
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

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold">סטטיסטיקה</h1>
        <p className="text-muted-foreground text-sm mt-0.5">7 ימים אחרונים</p>
      </div>

      {/* Week Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-4">
        <div className="bg-card rounded-2xl p-4">
          <div className="text-3xl font-black text-amber-400">{weekTotal}</div>
          <div className="text-xs text-muted-foreground mt-1">סיגריות השבוע</div>
        </div>
        <div className="bg-card rounded-2xl p-4">
          <div className={cn('text-3xl font-black', daysUnderGoal >= 5 ? 'text-emerald-400' : 'text-red-400')}>
            {daysUnderGoal}/7
          </div>
          <div className="text-xs text-muted-foreground mt-1">ימים ביעד</div>
        </div>
        <div className="bg-card rounded-2xl p-4">
          <div className="text-3xl font-black text-blue-400">{avgPerDay}</div>
          <div className="text-xs text-muted-foreground mt-1">ממוצע יומי</div>
        </div>
        <div className="bg-card rounded-2xl p-4">
          <div className="text-3xl font-black text-rose-400">₪{monthActualCost.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground mt-1">הוצאה חודשית</div>
        </div>
      </div>

      {/* Cost Comparison Section */}
      <div className="px-5 mb-4">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">עלות מול יעד</p>

        {/* Weekly Cost */}
        <div className={cn(
          'rounded-2xl p-4 border mb-3',
          weekSaved ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-red-500/8 border-red-500/25'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">השבוע</p>
              <div className="flex items-baseline gap-1.5">
                {weekSaved
                  ? <TrendingDown size={16} className="text-emerald-400 mb-0.5" />
                  : <TrendingUp size={16} className="text-red-400 mb-0.5" />
                }
                <p className={cn('text-xl font-black', weekSaved ? 'text-emerald-400' : 'text-red-400')}>
                  {weekSaved ? `חסכת ₪${weekCostDiff.toFixed(0)}` : `הוצאת ₪${Math.abs(weekCostDiff).toFixed(0)} יותר`}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                בפועל ₪{weekActualCost.toFixed(0)} · לפי יעד ₪{weekGoalCost.toFixed(0)}
              </p>
            </div>
            <div className="text-3xl">{weekSaved ? '✅' : '💸'}</div>
          </div>
        </div>

        {/* Monthly Cost */}
        <div className={cn(
          'rounded-2xl p-4 border',
          monthSaved ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-red-500/8 border-red-500/25'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">החודש (עד היום)</p>
              <div className="flex items-baseline gap-1.5">
                {monthSaved
                  ? <TrendingDown size={16} className="text-emerald-400 mb-0.5" />
                  : <TrendingUp size={16} className="text-red-400 mb-0.5" />
                }
                <p className={cn('text-xl font-black', monthSaved ? 'text-emerald-400' : 'text-red-400')}>
                  {monthSaved ? `חסכת ₪${monthCostDiff.toFixed(0)}` : `הוצאת ₪${Math.abs(monthCostDiff).toFixed(0)} יותר`}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                בפועל ₪{monthActualCost.toFixed(0)} · לפי יעד ₪{monthGoalCost.toFixed(0)}
              </p>
            </div>
            <div className="text-3xl">{monthSaved ? '💰' : '📉'}</div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-card mx-5 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold mb-4">סיגריות לפי יום</h2>
        {loadingData ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">טוען...</div>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={weekStats} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                  <Cell
                    key={i}
                    fill={entry.count > entry.goal ? '#ef4444' : entry.count >= entry.goal * 0.8 ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />ביעד</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />קרוב ליעד</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />עבר יעד</span>
        </div>
      </div>

      {/* Health Milestones */}
      <div className="bg-card mx-5 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-semibold mb-3">מה קורה לגוף כשמפסיקים</h2>
        <div className="space-y-3.5">
          {[
            { time: '20 דקות', text: 'לחץ הדם חוזר לנורמה', icon: '❤️' },
            { time: '8 שעות', text: 'פחמן חד-חמצני יוצא מהדם', icon: '🫁' },
            { time: '24 שעות', text: 'הסיכון להתקף לב יורד', icon: '💪' },
            { time: '48 שעות', text: 'חוש הריח והטעם משתפרים', icon: '👃' },
            { time: '2 שבועות', text: 'זרימת הדם משתפרת משמעותית', icon: '🩸' },
          ].map(({ time, text, icon }) => (
            <div key={time} className="flex items-center gap-3">
              <span className="text-xl w-7 text-center">{icon}</span>
              <div>
                <div className="text-xs font-semibold text-amber-400">{time} ללא עישון</div>
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
