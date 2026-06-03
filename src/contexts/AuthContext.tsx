'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider, firebaseConfigured } from '@/lib/firebase'
import { getUserProfile, saveUserProfile, generateInviteCode } from '@/lib/firestore'
import { UserProfile } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u: User) {
    let p = await getUserProfile(u.uid)
    if (!p) {
      p = {
        uid: u.uid,
        email: u.email ?? '',
        displayName: u.displayName ?? 'אורח',
        photoURL: u.photoURL ?? undefined,
        dailyGoal: 10,
        pricePerPack: 35,
        cigarettesPerPack: 20,
        joinedAt: new Date().toISOString(),
        inviteCode: generateInviteCode(),
        streak: 0,
      }
      await saveUserProfile(p)
      // Notify admin via Telegram (silent — never blocks login)
      fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🆕 <b>משתמש חדש ב-Smokeless!</b>\n👤 ${p.displayName}\n📧 ${p.email}\n📅 ${new Date().toLocaleString('he-IL')}`,
        }),
      }).catch(() => {})
    }
    setProfile(p)
  }

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false)
      return
    }
    // Handle redirect result for mobile sign-in
    getRedirectResult(auth).catch(() => {})

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await loadProfile(u)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInWithGoogle() {
    const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider)
    } else {
      await signInWithPopup(auth, googleProvider)
    }
  }

  async function logout() {
    await signOut(auth)
  }

  async function refreshProfile() {
    if (user) await loadProfile(user)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
