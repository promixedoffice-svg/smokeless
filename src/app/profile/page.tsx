'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { LoginScreen } from '@/components/LoginScreen'
import { saveUserProfile, resetAllUserLogs } from '@/lib/firestore'
import { CheckCircle2, Trash2, AlertTriangle, MessageCircle, Mail, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isSoundEnabled, setSoundEnabled, requestNotificationPermission } from '@/lib/sound'
import { useLanguage } from '@/contexts/LanguageContext'
import { APP_VERSION, APP_VERSION_DATE, WHATSAPP_URL, SUPPORT_EMAIL, COMPANY_NAME, COMPANY_REG, SUPPORT_PHONE, SUPPORT_PHONE_INTL } from '@/lib/constants'

export default function ProfilePage() {
  const { user, profile, refreshProfile, loading } = useAuth()
  const { lang, setLang, t, dir } = useLanguage()
  const displayPhone = lang === 'en' ? SUPPORT_PHONE_INTL : SUPPORT_PHONE

  const [pricePerPack, setPricePerPack] = useState(35)
  const [cigarettesPerPack, setCigarettesPerPack] = useState(20)
  const [cigaretteBrand, setCigaretteBrand] = useState('')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [currency, setCurrency] = useState<'₪' | '$'>('₪')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [floatingBtn, setFloatingBtn] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [notifGranted, setNotifGranted] = useState(false)

  useEffect(() => {
    setFloatingBtn(localStorage.getItem('smokeless_floating_btn_hidden') === 'true')
    setSoundOn(isSoundEnabled())
    setNotifGranted(typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted')
  }, [])

  useEffect(() => {
    if (!profile) return
    setPricePerPack(profile.pricePerPack ?? 35)
    setCigarettesPerPack(profile.cigarettesPerPack ?? 20)
    setCigaretteBrand(profile.cigaretteBrand ?? '')
    setAge(profile.age ? String(profile.age) : '')
    setWeight(profile.weight ? String(profile.weight) : '')
    setHeight(profile.height ? String(profile.height) : '')
    setCurrency(profile.currency ?? '₪')
    setReminderEnabled(profile.reminderEnabled ?? false)
  }, [profile])

  if (loading) return null
  if (!user) return <LoginScreen />

  const pricePerCig = pricePerPack / cigarettesPerPack

  async function handleReset() {
    if (!user) return
    setResetting(true)
    await resetAllUserLogs(user.uid)
    setResetting(false)
    setResetDone(true)
    setShowResetConfirm(false)
    setTimeout(() => setResetDone(false), 3000)
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    await saveUserProfile({
      uid: profile.uid,
      pricePerPack,
      cigarettesPerPack,
      cigaretteBrand,
      currency,
      reminderEnabled,
      age: age ? Number(age) : undefined,
      weight: weight ? Number(weight) : undefined,
      height: height ? Number(height) : undefined,
    })
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleReminderToggle() {
    const next = !reminderEnabled
    setReminderEnabled(next)
    if (next && Notification.permission !== 'granted') {
      const ok = await requestNotificationPermission()
      setNotifGranted(ok)
      if (!ok) { setReminderEnabled(false); return }
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28" dir={dir}>
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold">{t('profile_title')}</h1>
      </div>

      {/* Avatar + name */}
      <div className="px-5 mb-5 flex items-center gap-4">
        {profile?.photoURL && (
          <img src={profile.photoURL} alt="" className="w-16 h-16 rounded-full border-2 border-amber-400/40" />
        )}
        <div>
          <p className="text-lg font-bold">{profile?.displayName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-card mx-5 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold mb-4">{t('profile_personal')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('profile_age'), value: age, set: setAge, min: 10, max: 100 },
            { label: t('profile_weight'), value: weight, set: setWeight, min: 30, max: 300 },
            { label: t('profile_height'), value: height, set: setHeight, min: 100, max: 250 },
          ].map(({ label, value, set, min, max }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
              <input
                type="number" min={min} max={max} value={value}
                onChange={e => set(e.target.value)}
                placeholder={t('profile_optional')}
                className="w-full border border-input bg-background rounded-xl px-2 py-2.5 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50 placeholder:text-muted-foreground/40 placeholder:text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Pack details */}
      <div className="bg-card mx-5 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold mb-4">{t('profile_pack')}</h2>
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1.5 block">{t('profile_brand')}</label>
          <input
            type="text" placeholder={t('profile_brand_placeholder')} value={cigaretteBrand}
            onChange={e => setCigaretteBrand(e.target.value)}
            className="w-full border border-input bg-background rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('profile_price')} ({currency})</label>
            <input
              type="number" min={1} max={500} value={pricePerPack}
              onChange={e => setPricePerPack(Number(e.target.value))}
              className="w-full border border-input bg-background rounded-xl px-3 py-3 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('profile_per_pack')}</label>
            <input
              type="number" min={10} max={25} value={cigarettesPerPack}
              onChange={e => setCigarettesPerPack(Number(e.target.value))}
              className="w-full border border-input bg-background rounded-xl px-3 py-3 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>
        </div>
        {/* Currency selector */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">{t('profile_currency')}</span>
          <div className="flex gap-2">
            {(['₪', '$'] as const).map(c => (
              <button key={c} onClick={() => setCurrency(c)}
                className={cn('px-3 py-1 rounded-lg text-sm font-bold transition-all',
                  currency === c ? 'bg-amber-400 text-black' : 'border border-border text-foreground')}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-muted-foreground">{t('profile_per_cig')} </span>
          <span className="text-xs font-semibold text-amber-400">{currency}{pricePerCig.toFixed(2)}</span>
        </div>
      </div>

      {/* Settings */}
      <div className="mx-5 mb-4">
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">{t('profile_settings')}</p>
        <div className="space-y-2">

          {/* Sound */}
          <div className="bg-card rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('profile_sound')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('profile_sound_sub')}</p>
            </div>
            <button
              onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next) }}
              className={cn('w-12 h-6 rounded-full transition-colors relative', soundOn ? 'bg-amber-400' : 'bg-muted')}
            >
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', soundOn ? 'left-6' : 'left-0.5')} />
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-card rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('profile_notif')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {notifGranted ? t('profile_notif_on') : t('profile_notif_off')}
              </p>
            </div>
            {notifGranted ? (
              <span className="text-xs text-emerald-400 font-semibold">{t('profile_notif_active')}</span>
            ) : (
              <button
                onClick={async () => { const ok = await requestNotificationPermission(); setNotifGranted(ok) }}
                className="text-xs bg-amber-400 text-black font-bold px-3 py-1.5 rounded-lg active:scale-95"
              >
                {t('profile_notif_enable')}
              </button>
            )}
          </div>

          {/* Reminder */}
          <div className="bg-card rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('profile_reminder')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('profile_reminder_sub')}</p>
            </div>
            <button
              onClick={handleReminderToggle}
              className={cn('w-12 h-6 rounded-full transition-colors relative', reminderEnabled ? 'bg-amber-400' : 'bg-muted')}
            >
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', reminderEnabled ? 'left-6' : 'left-0.5')} />
            </button>
          </div>

          {/* Floating button */}
          <div className="bg-card rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('profile_floating')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('profile_floating_sub')}</p>
            </div>
            <button
              onClick={() => {
                const next = !floatingBtn
                setFloatingBtn(next)
                if (next) localStorage.setItem('smokeless_floating_btn_hidden', 'true')
                else localStorage.removeItem('smokeless_floating_btn_hidden')
              }}
              className={cn('w-12 h-6 rounded-full transition-colors relative', floatingBtn ? 'bg-amber-400' : 'bg-muted')}
            >
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', floatingBtn ? 'left-6' : 'left-0.5')} />
            </button>
          </div>

          {/* Language */}
          <div className="bg-card rounded-2xl p-4 flex items-center justify-between">
            <p className="text-sm font-medium">{t('profile_language')}</p>
            <div className="flex gap-2">
              <button onClick={() => setLang('he')}
                className={cn('px-4 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95',
                  lang === 'he' ? 'bg-amber-400 text-black' : 'border border-border text-foreground')}>
                עברית
              </button>
              <button onClick={() => setLang('en')}
                className={cn('px-4 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95',
                  lang === 'en' ? 'bg-amber-400 text-black' : 'border border-border text-foreground')}>
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="px-5 mb-4">
        <button onClick={handleSave} disabled={saving}
          className={cn('w-full h-14 rounded-2xl text-base font-bold transition-all active:scale-95',
            saved ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-300 text-black')}>
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 size={20} /> {t('profile_saved')}
            </span>
          ) : saving ? t('profile_saving') : t('profile_save')}
        </button>
      </div>

      {/* Support */}
      <div className="mx-5 mb-4">
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">{t('profile_support')}</p>
        <div className="bg-card rounded-2xl overflow-hidden">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 border-b border-border active:bg-muted/30">
            <MessageCircle size={18} className="text-emerald-400" />
            <div>
              <p className="text-sm font-medium">WhatsApp</p>
              <p className="text-xs text-muted-foreground">{displayPhone} · {t('profile_support_wa')}</p>
            </div>
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-border active:bg-muted/30">
            <Mail size={18} className="text-blue-400" />
            <div>
              <p className="text-sm font-medium">{t('profile_support_email')}</p>
              <p className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
            </div>
          </a>
          <Link href="/terms"
            className="flex items-center gap-3 px-4 py-3.5 active:bg-muted/30">
            <FileText size={18} className="text-amber-400" />
            <div>
              <p className="text-sm font-medium">{t('profile_terms_link')}</p>
              <p className="text-xs text-muted-foreground">{t('profile_terms_desc')}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Reset */}
      <div className="mx-5 mb-4">
        <div className="bg-card rounded-2xl p-5 border border-red-500/20">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">{t('profile_reset_title')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('profile_reset_desc')}</p>
            </div>
          </div>
          {!showResetConfirm ? (
            <button onClick={() => setShowResetConfirm(true)}
              className="w-full h-11 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Trash2 size={15} /> {t('profile_reset_btn')}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-center text-sm font-semibold text-red-400">{t('profile_reset_confirm')}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowResetConfirm(false)}
                  className="h-11 rounded-xl bg-muted text-sm font-semibold active:scale-95 transition-all">
                  {t('profile_reset_cancel')}
                </button>
                <button onClick={handleReset} disabled={resetting}
                  className="h-11 rounded-xl bg-red-500 text-white text-sm font-semibold active:scale-95 transition-all disabled:opacity-60">
                  {resetting ? t('profile_resetting') : t('profile_reset_yes')}
                </button>
              </div>
            </div>
          )}
          {resetDone && (
            <p className="text-center text-xs text-emerald-400 mt-2 font-medium">{t('profile_reset_done')}</p>
          )}
        </div>
      </div>

      {/* App version */}
      <div className="px-5 pb-4 text-center">
        <p className="text-xs text-muted-foreground/50">Smokeless v{APP_VERSION} · {APP_VERSION_DATE}</p>
        <p className="text-xs text-muted-foreground/40 mt-0.5">{COMPANY_NAME} · {COMPANY_REG}</p>
      </div>

      <NavBar />
    </div>
  )
}
