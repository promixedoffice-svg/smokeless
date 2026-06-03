'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { COMPANY_NAME, COMPANY_REG, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_INTL, WHATSAPP_URL, APP_VERSION, APP_VERSION_DATE } from '@/lib/constants'
import { useLanguage } from '@/contexts/LanguageContext'

export default function TermsPage() {
  const { t, dir, lang } = useLanguage()
  const isRtl = lang === 'he'
  const displayPhone = isRtl ? SUPPORT_PHONE : SUPPORT_PHONE_INTL
  const BackIcon = isRtl ? ArrowRight : ArrowLeft

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3 z-10">
        <Link href="/profile" className="text-muted-foreground">
          <BackIcon size={20} />
        </Link>
        <h1 className="text-lg font-bold">{t('terms_page_title')}</h1>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-8 pb-16">

        {/* Company info */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-sm font-bold text-amber-400 mb-1">Smokeless</p>
          <p className="text-xs text-muted-foreground">{COMPANY_NAME} · {COMPANY_REG}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('terms_page_version')} {APP_VERSION} · {APP_VERSION_DATE}</p>
        </div>

        {/* Terms of Use */}
        <section>
          <h2 className="text-base font-bold mb-3 text-amber-400">{t('terms_use_title')}</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>{t('terms_use_welcome')}</p>
            <p><strong className="text-foreground">{t('terms_use_allowed_title')}</strong> {t('terms_use_allowed')}</p>
            <p><strong className="text-foreground">{t('terms_use_liability_title')}</strong> {t('terms_use_liability')}</p>
            <p><strong className="text-foreground">{t('terms_use_compete_title')}</strong> {t('terms_use_compete')}</p>
            <p><strong className="text-foreground">{t('terms_use_availability_title')}</strong> {t('terms_use_availability')}</p>
            <p><strong className="text-foreground">{t('terms_use_forbidden_title')}</strong> {t('terms_use_forbidden')}</p>
            <p><strong className="text-foreground">{t('terms_use_changes_title')}</strong> {t('terms_use_changes')}</p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section>
          <h2 className="text-base font-bold mb-3 text-amber-400">{t('terms_privacy_title')}</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">{t('terms_privacy_collected_title')}</strong> {t('terms_privacy_collected_intro')}</p>
            <ul className="list-disc list-inside space-y-1 mr-3 ml-3">
              <li>{t('terms_privacy_item1')}</li>
              <li>{t('terms_privacy_item2')}</li>
              <li>{t('terms_privacy_item3')}</li>
              <li>{t('terms_privacy_item4')}</li>
            </ul>
            <p><strong className="text-foreground">{t('terms_privacy_use_title')}</strong> {t('terms_privacy_use')}</p>
            <p><strong className="text-foreground">{t('terms_privacy_storage_title')}</strong> {t('terms_privacy_storage')}</p>
            <p><strong className="text-foreground">{t('terms_privacy_delete_title')}</strong> {t('terms_privacy_delete')}</p>
            <p><strong className="text-foreground">{t('terms_privacy_local_title')}</strong> {t('terms_privacy_local')}</p>
            <p><strong className="text-foreground">{t('terms_privacy_minors_title')}</strong> {t('terms_privacy_minors')}</p>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-base font-bold mb-3 text-amber-400">{t('terms_contact_title')}</h2>
          <div className="bg-card rounded-2xl p-5 space-y-3">
            <p className="text-sm text-muted-foreground">{t('terms_contact_desc')}</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 text-sm text-amber-400 font-medium">
              📧 {SUPPORT_EMAIL}
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
              💬 WhatsApp: {displayPhone}
            </a>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              {COMPANY_NAME} · {COMPANY_REG}
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
