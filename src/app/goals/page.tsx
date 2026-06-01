'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { LoginScreen } from '@/components/LoginScreen'
import { saveUserProfile } from '@/lib/firestore'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GoalsPage() {
  const { user, profile, refreshProfile, loading } = useAuth()
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoal ?? 10)
  const [pricePerPack, setPricePerPack] = useState(profile?.pricePerPack ?? 35)
  const [cigarettesPerPack, setCigarettesPerPack] = useState(profile?.cigarettesPerPack ?? 20)
  const [cigaretteBrand, setCigaretteBrand] = useState(profile?.cigaretteBrand ?? '')
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
    await saveUserProfile({ uid: profile.uid, dailyGoal, pricePerPack, cigarettesPerPack, cigaretteBrand })
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const goalLevels = [
    { goal: 5, label: 'קשה מאוד', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/40' },
    { goal: 10, label: 'אתגרי', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/40' },
    { goal: 15, label: 'מתון', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/40' },
    { goal: 20, label: 'התחלה', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/40' },
  ]

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold">יעדים והגדרות</h1>
        <p className="text-muted-foreground text-sm mt-0.5">הגדר את היעד ופרטי החפיסה</p>
      </div>

      {/* Quick Goal Presets */}
      <div className="px-5 mb-5">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">רמת אתגר יומי</p>
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
              <div className={cn('text-2xl font-black', dailyGoal === goal ? color : 'text-foreground')}>
                {goal}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Goal Slider */}
      <div className="bg-card mx-5 rounded-2xl p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium text-muted-foreground">יעד מותאם אישית</label>
          <span className="text-3xl font-black text-amber-400">{dailyGoal}</span>
        </div>
        <input
          type="range" min={1} max={40} value={dailyGoal}
          onChange={(e) => setDailyGoal(Number(e.target.value))}
          className="w-full accent-amber-400 h-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>1 — ממש אתגרי</span>
          <span>40 — ממוצע</span>
        </div>
      </div>

      {/* Cigarette Details */}
      <div className="bg-card mx-5 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold mb-4">פרטי חפיסה</h2>

        {/* Brand */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1.5 block">סוג / מותג סיגריות</label>
          <input
            type="text"
            placeholder="למשל: מרלבורו, נוֹבל, טיים..."
            value={cigaretteBrand}
            onChange={(e) => setCigaretteBrand(e.target.value)}
            className="w-full border border-input bg-background rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">מחיר חפיסה (₪)</label>
            <input
              type="number" min={10} max={100} value={pricePerPack}
              onChange={(e) => setPricePerPack(Number(e.target.value))}
              className="w-full border border-input bg-background rounded-xl px-3 py-3 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">סיגריות בחפיסה</label>
            <input
              type="number" min={10} max={25} value={cigarettesPerPack}
              onChange={(e) => setCigarettesPerPack(Number(e.target.value))}
              className="w-full border border-input bg-background rounded-xl px-3 py-3 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border text-center">
          <span className="text-xs text-muted-foreground">עלות לסיגריה: </span>
          <span className="text-xs font-semibold text-amber-400">₪{pricePerCig.toFixed(2)}</span>
        </div>
      </div>

      {/* Cost Projection */}
      <div className="bg-card mx-5 rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-semibold mb-4">עלות לפי היעד שלך</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-background rounded-xl p-3">
            <div className="text-xl font-bold text-rose-400">₪{dailyCost}</div>
            <div className="text-xs text-muted-foreground mt-1">יום</div>
          </div>
          <div className="bg-background rounded-xl p-3">
            <div className="text-xl font-bold text-rose-400">₪{weeklyCost}</div>
            <div className="text-xs text-muted-foreground mt-1">שבוע</div>
          </div>
          <div className="bg-background rounded-xl p-3">
            <div className="text-xl font-bold text-rose-400">₪{monthlyCost}</div>
            <div className="text-xs text-muted-foreground mt-1">חודש</div>
          </div>
        </div>
      </div>

      <div className="px-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'w-full h-14 rounded-2xl text-base font-bold transition-all active:scale-95',
            saved ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-300 text-black'
          )}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 size={20} /> נשמר!
            </span>
          ) : saving ? 'שומר...' : 'שמור הגדרות'}
        </button>
      </div>

      <NavBar />
    </div>
  )
}
