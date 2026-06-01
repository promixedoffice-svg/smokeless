'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { saveUserProfile } from '@/lib/firestore'
import { Settings, LogOut, Check, Camera } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'

interface Props {
  onEditGoals: () => void
}

export function LogoutMenu({ onEditGoals }: Props) {
  const { profile, logout, refreshProfile } = useAuth()
  const [editingName, setEditingName] = useState(false)
  const [nickname, setNickname] = useState(profile?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)

  async function handleSaveName() {
    if (!profile || !nickname.trim()) return
    setSavingName(true)
    await saveUserProfile({ uid: profile.uid, displayName: nickname.trim() })
    await refreshProfile()
    setSavingName(false)
    setEditingName(false)
  }

  const displayName = profile?.displayName ?? ''
  const initials = displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Sheet>
      <SheetTrigger className="flex items-center gap-2 cursor-pointer">
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-400/30" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-amber-400/20 flex items-center justify-center text-sm font-bold text-amber-400">
            {initials || '?'}
          </div>
        )}
      </SheetTrigger>

      <SheetContent side="right" dir="rtl" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-right">פרופיל והגדרות</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {/* Profile photo + name */}
          <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-muted">
            <div className="relative">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-amber-400/40" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-amber-400/20 flex items-center justify-center text-2xl font-black text-amber-400">
                  {initials || '?'}
                </div>
              )}
              <div className="absolute bottom-0 left-0 bg-card rounded-full p-1 border border-border">
                <Camera size={12} className="text-muted-foreground" />
              </div>
            </div>

            {editingName ? (
              <div className="flex gap-2 w-full">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  placeholder="שם / כינוי"
                  maxLength={20}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="w-9 h-9 bg-amber-400 text-black rounded-xl flex items-center justify-center disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={() => { setNickname(profile?.displayName ?? ''); setEditingName(true) }}
                  className="font-semibold text-base hover:text-amber-400 transition-colors"
                >
                  {profile?.displayName}
                </button>
                <p className="text-xs text-muted-foreground mt-0.5">לחץ לשינוי שם / כינוי</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>

          {/* Invite code */}
          <div className="p-4 rounded-2xl bg-muted">
            <div className="text-muted-foreground text-xs mb-1">קוד הזמנה אישי</div>
            <div className="font-mono font-black text-2xl tracking-widest text-amber-400">
              {profile?.inviteCode}
            </div>
          </div>

          {/* Edit goals */}
          <button
            onClick={onEditGoals}
            className="flex items-center gap-3 w-full p-3 rounded-2xl bg-muted hover:bg-muted/70 transition-colors text-sm active:scale-95"
          >
            <Settings size={18} className="text-muted-foreground" />
            ערוך יעדים והגדרות
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full p-3 rounded-2xl bg-muted hover:bg-muted/70 transition-colors text-sm text-red-400 active:scale-95"
          >
            <LogOut size={18} />
            התנתק
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
