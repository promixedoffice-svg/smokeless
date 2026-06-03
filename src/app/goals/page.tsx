'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { LoginScreen } from '@/components/LoginScreen'
import { saveUserProfile } from '@/lib/firestore'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export default function GoalsPage() {
  const { user, profile, refreshProfile, loading } = useAuth()
  const { t, dir } = useLanguage()
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoal ?? 10)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (loading) return null
  if (!user) return <LoginScreen />

  const pricePerCig = (profile?.pricePerPack ?? 35) / (profile?.cigarettesPerPack ?? 20)
  const dailyCost = (dailyGoal * pricePerCig).toFixed(1)
  const weeklyCost = (dailyGoal * 7 * pricePerCig).toFixed(0)
  const monthlyCost = (dailyGoal * 30 * pricePerCig).toFixed(0)

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    await saveUserProfile({ uid: profile.uid, dailyGoal })
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const goalLevels = [
    { goal: 5, label: t('goals_very_hard'), color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/40' },
    { goal: 10, label: t('goals_challenging'), color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/40' },
    { goal: 15, label: t('goals_moderate'), color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/40' },
    { goal: 20, label: t('goals_start'), color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/40' },
  ]

  return (
    <div className="min-h-screen bg-background pb-28" dir={dir}>
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold">{t('goals_title')}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t('goals_subtitle')}</p>
      </div>

      {/* Quick Goal Presets */}
      <div className="px-5 mb-5">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">{t('goals_level')}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {goalLevels.map(({ goal, label, color, bg }) => (
            <button
              key={goal}
              onClick={() => setDailyGoal(goal)}
              className={cn(
                'border rounded-2xl p-4 text-right transition-all active:scale-95',
                dailyGoal === goal ? bg : 'border-border bg-card'
              )}
            >
              <div className={cn('text-2xl font-black', dailyGoal === goal ? color : 'text-foreground')}>{goal}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Goal Slider */}
      <div className="bg-card mx-5 rounded-2xl p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium text-muted-foreground">{t('goals_custom')}</label>
          <span className="text-3xl font-black text-amber-400">{dailyGoal}</span>
        </div>
        <input
          type="range" min={1} max={40} value={dailyGoal}
          onChange={e => setDailyGoal(Number(e.target.value))}
          className="w-full accent-amber-400 h-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{t('goals_min')}</span>
          <span>{t('goals_max')}</span>
        </div>
      </div>

      {/* Cost Projection */}
      <div className="bg-card mx-5 rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-semibold mb-4">{t('goals_cost_title')}</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-background rounded-xl p-3">
            <div className="text-xl font-bold text-rose-400">₪{dailyCost}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('goals_day')}</div>
          </div>
          <div className="bg-background rounded-xl p-3">
            <div className="text-xl font-bold text-rose-400">₪{weeklyCost}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('goals_week')}</div>
          </div>
          <div className="bg-background rounded-xl p-3">
            <div className="text-xl font-bold text-rose-400">₪{monthlyCost}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('goals_month')}</div>
          </div>
        </div>
      </div>

      <div className="px-5">
        <button
          onClick={handleSave} disabled={saving}
          className={cn(
            'w-full h-14 rounded-2xl text-base font-bold transition-all active:scale-95',
            saved ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-300 text-black'
          )}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 size={20} /> {t('goals_saved')}
            </span>
          ) : saving ? t('goals_saving') : t('goals_save')}
        </button>
      </div>

      <NavBar />
    </div>
  )
}
