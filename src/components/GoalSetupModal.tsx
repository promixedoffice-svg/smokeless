'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { saveUserProfile } from '@/lib/firestore'

interface Props {
  open: boolean
  onClose: () => void
}

export function GoalSetupModal({ open, onClose }: Props) {
  const { profile, refreshProfile } = useAuth()
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoal ?? 10)
  const [pricePerPack, setPricePerPack] = useState(profile?.pricePerPack ?? 35)
  const [cigarettesPerPack, setCigarettesPerPack] = useState(profile?.cigarettesPerPack ?? 20)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    await saveUserProfile({ uid: profile.uid, dailyGoal, pricePerPack, cigarettesPerPack })
    await refreshProfile()
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl text-right">הגדרת יעדים</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div>
            <label className="block text-sm font-medium mb-3">
              יעד יומי: <span className="text-amber-500 font-bold">{dailyGoal} סיגריות</span>
            </label>
            <input
              type="range" min={1} max={40} value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span><span>20</span><span>40</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">מחיר חפיסה (₪)</label>
            <input
              type="number" min={10} max={100} value={pricePerPack}
              onChange={(e) => setPricePerPack(Number(e.target.value))}
              className="w-full border border-input bg-background rounded-lg px-3 py-2 text-center text-lg font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">סיגריות בחפיסה</label>
            <input
              type="number" min={10} max={25} value={cigarettesPerPack}
              onChange={(e) => setCigarettesPerPack(Number(e.target.value))}
              className="w-full border border-input bg-background rounded-lg px-3 py-2 text-center text-lg font-semibold"
            />
          </div>

          <div className="bg-muted rounded-xl p-3 text-center text-sm text-muted-foreground">
            עלות לסיגריה: <span className="font-semibold text-foreground">
              ₪{(pricePerPack / cigarettesPerPack).toFixed(2)}
            </span>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-bold">
            {saving ? 'שומר...' : 'שמור יעדים'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
