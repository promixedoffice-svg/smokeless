'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { saveUserProfile } from '@/lib/firestore'
import { COMPANY_NAME, COMPANY_REG } from '@/lib/constants'

export function TermsGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth()
  const { t, dir } = useLanguage()
  const pathname = usePathname()
  const [accepting, setAccepting] = useState(false)

  if (pathname === '/terms') return <>{children}</>
  if (!user || !profile) return <>{children}</>
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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center px-4 pb-8" dir={dir}>
        <div className="bg-card rounded-3xl p-6 w-full max-w-sm border border-border shadow-2xl">
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-lg font-bold mb-1">{t('terms_title')}</h2>
            <p className="text-xs text-muted-foreground">{t('terms_subtitle')}</p>
          </div>

          <div className="bg-background rounded-2xl p-4 mb-5 text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>{t('terms_desc1')}</p>
            <p>{t('terms_desc2')}</p>
            <p>
              {t('terms_desc3')}{' '}
              <Link href="/terms" className="text-amber-400 font-semibold">{t('terms_full_link')}</Link>
              {' '}&{' '}
              <Link href="/terms" className="text-amber-400 font-semibold">{t('terms_privacy_link')}</Link>.
            </p>
            <p className="pt-1 border-t border-border text-[10px]">
              {COMPANY_NAME} · {COMPANY_REG}
            </p>
          </div>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3.5 rounded-2xl bg-amber-400 text-black font-bold text-sm active:scale-95 transition-all disabled:opacity-60"
          >
            {accepting ? t('terms_saving') : t('terms_accept')}
          </button>

          <p className="text-center text-[10px] text-muted-foreground mt-3">
            {t('terms_accept_note')}
          </p>
        </div>
      </div>
    </>
  )
}
