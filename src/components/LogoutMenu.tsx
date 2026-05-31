'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Settings, LogOut } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface Props {
  onEditGoals: () => void
}

export function LogoutMenu({ onEditGoals }: Props) {
  const { profile, logout } = useAuth()

  return (
    <Sheet>
      <SheetTrigger className="flex items-center gap-2 cursor-pointer">
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
            {profile?.displayName?.[0] ?? '?'}
          </div>
        )}
      </SheetTrigger>
      <SheetContent side="right" dir="rtl" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-right">הגדרות</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center font-bold">
                {profile?.displayName?.[0]}
              </div>
            )}
            <div>
              <div className="font-semibold text-sm">{profile?.displayName}</div>
              <div className="text-xs text-muted-foreground">{profile?.email}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted text-sm">
            <div className="text-muted-foreground text-xs mb-1">קוד הזמנה אישי</div>
            <div className="font-mono font-bold text-lg tracking-widest text-amber-400">
              {profile?.inviteCode}
            </div>
          </div>

          <button
            onClick={onEditGoals}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-colors text-sm"
          >
            <Settings size={18} className="text-muted-foreground" />
            ערוך יעדים
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-colors text-sm text-red-400"
          >
            <LogOut size={18} />
            התנתק
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
