'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Lang } from '@/lib/translations'

const LANG_KEY = 'smokeless_lang'

type LanguageContextType = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  dir: 'rtl' | 'ltr'
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'he',
  setLang: () => {},
  t: (key) => translations.he[key] ?? key,
  dir: 'rtl',
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('he')

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null
    if (stored === 'en' || stored === 'he') setLangState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
  }, [lang])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem(LANG_KEY, l)
  }

  function t(key: string): string {
    return translations[lang][key] ?? translations.he[key] ?? key
  }

  const dir: 'rtl' | 'ltr' = lang === 'he' ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
