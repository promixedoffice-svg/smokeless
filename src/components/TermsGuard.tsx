'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { saveUserProfile } from '@/lib/firestore'
import { COMPANY_NAME, COMPANY_REG } from '@/lib/constants'

export function TermsGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth()
  const pathname = usePathname()
  const [accepting, setAccepting] = useState(false)

  // Don't block the terms page itself
  if (pathname === '/terms') return <>{children}</>

  // Not logged in — let the page handle it
  if (!user || !profile) return <>{children}</>

  // Already accepted
  if (profile.termsAccepted) return <>{children}</>

  async function handleAccept() {
    if (!profile) return
    setAccepting(true)
    await saveUserProfile({ uid: profile.uid, termsAccepted: true })
    await refreshProfile()
    setAccepting(false)
  }

  return (
    <>
      {children}
      {/* Full-screen overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center px-4 pb-8" dir="rtl">
        <div className="bg-card rounded-3xl p-6 w-full max-w-sm border border-border shadow-2xl">
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-lg font-bold mb-1">תנאי שימוש ופרטיות</h2>
            <p className="text-xs text-muted-foreground">
              לפני שממשיכים, נדרש אישורך לתנאי השימוש ומדיניות הפרטיות של Smokeless
            </p>
          </div>

          <div className="bg-background rounded-2xl p-4 mb-5 text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>האפליקציה מאפשרת מעקב אחר הרגלי עישון ותחרויות בין חברים.</p>
            <p>הנתונים שלך מאוחסנים בצורה מאובטחת ולא מועברים לצדדים שלישיים.</p>
            <p>השימוש לאחר האישור כפוף ל
              <Link href="/terms" className="text-amber-400 font-semibold mx-1">תנאי השימוש המלאים</Link>
              ו
              <Link href="/terms" className="text-amber-400 font-semibold mx-1">מדיניות הפרטיות</Link>.
            </p>
            <p className="pt-1 border-t border-border text-[10px]">
              {COMPANY_NAME} · {COMPANY_REG}
            </p>
          </div>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full h-13 py-3.5 rounded-2xl bg-amber-400 text-black font-bold text-sm active:scale-95 transition-all disabled:opacity-60"
          >
            {accepting ? 'שומר...' : 'אני מסכים/ה ומאשר/ת'}
          </button>

          <p className="text-center text-[10px] text-muted-foreground mt-3">
            לחיצה על "מסכים/ה" מהווה הסכמה לתנאים
          </p>
        </div>
      </div>
    </>
  )
}
