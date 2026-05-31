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
  const daysUnderGoal = weekStats.filter((d) => d.count <= dailyGoal).length
  const avgPerDay = weekTotal > 0 ? (weekTotal / weekStats.length).toFixed(1) : '0'
  const moneySavedVsGoal = ((weekStats.reduce((s, d) => s + Math.max(dailyGoal - d.count, 0), 0)) * pricePerCig).toFixed(0)
  const monthSpent = (monthTotal * pricePerCig).toFixed(0)

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">סטטיסטיקה</h1>
        <p className="text-muted-foreground text-sm">7 ימים אחרונים</p>
      </div>

      {/* Week Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-6">
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
          <div className="text-3xl font-black text-rose-400">₪{monthSpent}</div>
          <div className="text-xs text-muted-foreground mt-1">הוצאה חודשית</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-card mx-4 rounded-2xl p-4 mb-6">
        <h2 className="text-sm font-semibold mb-4">סיגריות לפי יום</h2>
        {loadingData ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">טוען...</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekStats} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, fontSize: 12 }}
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
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />ביעד</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />קרוב ליעד</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />עבר יעד</span>
          <span className="flex items-center gap-1"><span className="w-2 h-1 bg-amber-400/70 inline-block" />יעד</span>
        </div>
      </div>

      {/* Health Milestones */}
      <div className="bg-card mx-4 rounded-2xl p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3">אבני דרך בריאותיות</h2>
        <div className="space-y-3">
          {[
            { time: '20 דקות', text: 'לחץ הדם חוזר לנורמה', icon: '❤️' },
            { time: '8 שעות', text: 'פחמן חד-חמצני יוצא מהדם', icon: '🫁' },
            { time: '24 שעות', text: 'הסיכון להתקף לב יורד', icon: '💪' },
            { time: '48 שעות', text: 'חוש הריח והטעם משתפרים', icon: '👃' },
            { time: '2 שבועות', text: 'זרימת הדם משתפרת משמעותית', icon: '🩸' },
          ].map(({ time, text, icon }) => (
            <div key={time} className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
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
