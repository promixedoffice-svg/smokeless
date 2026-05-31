'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { LoginScreen } from '@/components/LoginScreen'
import { saveUserProfile } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GoalsPage() {
  const { user, profile, refreshProfile, loading } = useAuth()
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoal ?? 10)
  const [pricePerPack, setPricePerPack] = useState(profile?.pricePerPack ?? 35)
  const [cigarettesPerPack, setCigarettesPerPack] = useState(profile?.cigarettesPerPack ?? 20)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (loading) return null
  if (!user) return <LoginScreen />

  const pricePerCig = pricePerPack / cigarettesPerPack
  const dailyCost = (dailyGoal * pricePerCig).toFixed(1)
  const weeklyCost = (dailyGoal * 7 * pricePerCig).toFixed(0)
  const monthlyCost = (dailyGoal * 30 * pricePerCig).toFixed(0)

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    await saveUserProfile({ uid: profile.uid, dailyGoal, pricePerPack, cigarettesPerPack })
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const goalLevels = [
    { goal: 5, label: 'קשה מאוד', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
    { goal: 10, label: 'אתגרי', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
    { goal: 15, label: 'מתון', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
    { goal: 20, label: 'התחלה', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  ]

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">יעדים</h1>
        <p className="text-muted-foreground text-sm">הגדר את היעד היומי שלך</p>
      </div>

      {/* Quick Goal Presets */}
      <div className="px-4 mb-6">
        <p className="text-sm text-muted-foreground mb-3">בחר רמת אתגר:</p>
        <div className="grid grid-cols-2 gap-2">
          {goalLevels.map(({ goal, label, color, bg }) => (
            <button
              key={goal}
              onClick={() => setDailyGoal(goal)}
              className={cn(
                'border rounded-xl p-3 text-right transition-all',
                dailyGoal === goal ? bg + ' border-opacity-100' : 'border-border bg-card'
              )}
            >
              <div className={cn('text-xl font-black', dailyGoal === goal ? color : 'text-foreground')}>
                {goal}
              </div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Goal Slider */}
      <div className="bg-card mx-4 rounded-2xl p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium">יעד מותאם אישית</label>
          <span className="text-2xl font-black text-amber-400">{dailyGoal}</span>
        </div>
        <input
          type="range" min={1} max={40} value={dailyGoal}
          onChange={(e) => setDailyGoal(Number(e.target.value))}
          className="w-full accent-amber-400"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1 — ממש אתגרי</span>
          <span>40 — ממוצע</span>
        </div>
      </div>

      {/* Price Settings */}
      <div className="bg-card mx-4 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold mb-4">מחיר חפיסה</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">מחיר חפיסה (₪)</label>
            <input
              type="number" min={10} max={100} value={pricePerPack}
              onChange={(e) => setPricePerPack(Number(e.target.value))}
              className="w-full border border-input bg-background rounded-xl px-3 py-2 text-center text-lg font-semibold"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">סיגריות בחפיסה</label>
            <input
              type="number" min={10} max={25} value={cigarettesPerPack}
              onChange={(e) => setCigarettesPerPack(Number(e.target.value))}
              className="w-full border border-input bg-background rounded-xl px-3 py-2 text-center text-lg font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Cost Projection */}
      <div className="bg-card mx-4 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4">עלות לפי היעד שלך</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-rose-400">₪{dailyCost}</div>
            <div className="text-xs text-muted-foreground">יום</div>
          </div>
          <div>
            <div className="text-xl font-bold text-rose-400">₪{weeklyCost}</div>
            <div className="text-xs text-muted-foreground">שבוע</div>
          </div>
          <div>
            <div className="text-xl font-bold text-rose-400">₪{monthlyCost}</div>
            <div className="text-xs text-muted-foreground">חודש</div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'w-full h-14 text-base font-bold transition-all',
            saved ? 'bg-emerald-500 hover:bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-300 text-black'
          )}
        >
          {saved ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 size={20} /> נשמר!
            </span>
          ) : saving ? 'שומר...' : 'שמור יעדים'}
        </Button>
      </div>

      <NavBar />
    </div>
  )
}
